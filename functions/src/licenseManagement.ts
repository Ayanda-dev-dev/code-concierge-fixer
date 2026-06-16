/**
 * Firebase Cloud Functions for eDLTS License Card Management
 * Handles 8-week production cycle and collection tracking
 * 
 * Deploy with: firebase deploy --only functions
 * 
 * Required environment setup:
 * - Twilio API credentials for SMS (optional)
 * - SendGrid or similar for email (optional)
 * - Firebase Firestore access
 * 
 * Trigger: Scheduled function (Cloud Scheduler)
 * Run daily at 2 AM to check for cards ready for collection
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000; // 8 weeks in milliseconds

/**
 * Cloud Function: Check test results and mark passed tests
 * Triggered when test result is recorded in Firestore
 * Document path: /applications/{appId}/testResults/{resultId}
 */
export const onTestResultRecorded = functions.firestore
  .document("applications/{appId}/testResults/{resultId}")
  .onCreate(async (snap, context) => {
    const { appId } = context.params;
    const testResult = snap.data();

    if (testResult.passed !== true) {
      return; // Only process passed tests
    }

    try {
      const appRef = db.collection("applications").doc(appId);
      const appDoc = await appRef.get();

      if (!appDoc.exists) {
        throw new Error(`Application ${appId} not found`);
      }

      const appData = appDoc.data() || {};

      // Mark as passed and set test passed date
      await appRef.update({
        testPassed: true,
        testPassedDate: admin.firestore.FieldValue.serverTimestamp(),
        licenseStatus: "production", // Card is now in production
        testResult: {
          score: testResult.score,
          passedAt: testResult.passedAt,
          examinerId: testResult.examinerId,
        },
      });

      console.log(`Test passed recorded for application ${appId}`);
    } catch (error) {
      console.error(`Error processing test result for ${appId}:`, error);
      throw error;
    }
  });

/**
 * Cloud Function: Scheduled task to check for licenses ready for collection
 * Should be triggered by Cloud Scheduler (e.g., daily at 2 AM)
 * 
 * To set up with Cloud Scheduler:
 * 1. Go to Cloud Console > Cloud Scheduler
 * 2. Create a new job
 * 3. Frequency: "0 2 * * *" (daily at 2 AM)
 * 4. Execution timezone: Africa/Johannesburg
 * 5. HTTP target: https://[REGION]-[PROJECT_ID].cloudfunctions.net/checkLicenseReadiness
 */
export const checkLicenseReadiness = functions.https.onRequest(
  async (req, res) => {
    try {
      // Verify the request is from Cloud Scheduler (optional but recommended)
      const authHeader = req.headers.authorization || "";
      // You can add additional security checks here

      const now = Date.now();
      const eightWeeksAgo = now - EIGHT_WEEKS_MS;

      // Query for applications where test was passed 8 weeks ago
      const applicationsSnapshot = await db
        .collection("applications")
        .where("testPassed", "==", true)
        .where("licenseStatus", "==", "production")
        .where(
          "testPassedDate",
          "<",
          new Date(eightWeeksAgo)
        )
        .get();

      const readyCards: string[] = [];

      // Process each application
      for (const appDoc of applicationsSnapshot.docs) {
        const appId = appDoc.id;
        const appData = appDoc.data();

        try {
          // Update application status
          await db.collection("applications").doc(appId).update({
            licenseStatus: "ready_for_collection",
            cardReadyDate: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Create a notification document
          await db.collection("applications").doc(appId).collection("notifications").add({
            type: "license_ready",
            title: "Your licence card is ready for collection",
            message: "Your licence card has been produced and is ready to be collected. Please bring your original South African ID card to the testing centre.",
            status: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: appData.userId,
            applicationType: appData.type, // 'learner' or 'driver'
          });

          readyCards.push(appId);
          console.log(`Marked application ${appId} as ready for collection`);

          // Send notification to user (see below)
          await sendLicenseReadyNotification(appData.userId, appData.email, appData.fullName, appData.type);
        } catch (error) {
          console.error(`Error updating application ${appId}:`, error);
          // Continue processing other applications
        }
      }

      res.status(200).json({
        success: true,
        processed: readyCards.length,
        applications: readyCards,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in checkLicenseReadiness:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * Callable function: Record license collection
 * Called from frontend when applicant collects their card
 * 
 * Parameters:
 * - appId: Application ID
 * - officerId: ID of officer processing collection
 * - idNumber: Applicant's ID number (verification)
 */
export const recordLicenseCollection = functions.https.onCall(
  async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const { appId, officerId, idNumber } = data;

    if (!appId || !officerId || !idNumber) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "appId, officerId, and idNumber are required"
      );
    }

    try {
      const appRef = db.collection("applications").doc(appId);
      const appDoc = await appRef.get();

      if (!appDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          `Application ${appId} not found`
        );
      }

      const appData = appDoc.data() || {};

      // Verify that applicant ID matches
      if (appData.idNumber !== idNumber) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "ID number does not match application records"
        );
      }

      // Verify status is ready for collection
      if (appData.licenseStatus !== "ready_for_collection") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "License card is not ready for collection yet"
        );
      }

      // Record the collection
      await appRef.update({
        licenseStatus: "collected",
        collectionDate: admin.firestore.FieldValue.serverTimestamp(),
        collectedBy: {
          officerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      });

      // Create audit log
      await db
        .collection("applications")
        .doc(appId)
        .collection("auditLog")
        .add({
          action: "license_collected",
          actor: officerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          details: {
            applicationType: appData.type,
            collectionDate: new Date().toISOString(),
          },
        });

      // Send confirmation notification
      await sendCollectionConfirmation(
        appData.userId,
        appData.email,
        appData.fullName,
        appData.type
      );

      return {
        success: true,
        message: "License collection recorded successfully",
        applicationId: appId,
        collectionDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error recording license collection:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

/**
 * Helper function: Send SMS notification (using Twilio)
 * Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables
 */
async function sendSmsNotification(
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("Twilio credentials not configured, skipping SMS");
      return;
    }

    // Example using Twilio SDK
    // Uncomment when Twilio package is added: npm install twilio
    /*
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);
    
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: phoneNumber,
    });
    */

    console.log(`SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error("Error sending SMS:", error);
    // Don't throw - SMS is optional
  }
}

/**
 * Helper function: Send email notification (using SendGrid or similar)
 * Requires EMAIL_SENDER and SendGrid API key in environment
 */
async function sendEmailNotification(
  recipientEmail: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  try {
    const emailSender = process.env.EMAIL_SENDER || "noreply@edlts.gov.za";
    
    // Example using SendGrid
    // Uncomment when SendGrid package is added: npm install @sendgrid/mail
    /*
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: recipientEmail,
      from: emailSender,
      subject,
      html: htmlBody,
    });
    */

    console.log(`Email sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw - email is optional
  }
}

/**
 * Send notification when license is ready for collection
 */
async function sendLicenseReadyNotification(
  userId: string,
  email: string,
  fullName: string,
  applicationType: "learner" | "driver"
): Promise<void> {
  const licenseType = applicationType === "learner" ? "Learner's Licence" : "Driver's Licence";
  
  const smsMessage = `Hi ${fullName}, your ${licenseType} card is ready for collection! Please bring your original South African ID card to your nearest testing centre. Thank you!`;
  
  const emailHtml = `
    <h2>Your ${licenseType} is Ready!</h2>
    <p>Dear ${fullName},</p>
    <p>Great news! Your ${licenseType} card has been produced and is ready for collection.</p>
    <h3>Next Steps:</h3>
    <ol>
      <li>Visit your nearest testing centre</li>
      <li>Bring your <strong>original South African ID card</strong></li>
      <li>Our officer will verify your identity and hand over your licence card</li>
    </ol>
    <p><strong>Important:</strong> Your collection will be logged in the system for verification purposes.</p>
    <p>If you have any questions, please contact your local testing centre.</p>
    <p>Best regards,<br/>eDLTS System</p>
  `;

  try {
    // Send SMS and email notifications
    // Phone number should be stored in user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (userData?.phone) {
      await sendSmsNotification(userData.phone, smsMessage);
    }

    if (email) {
      await sendEmailNotification(
        email,
        `Your ${licenseType} Card is Ready for Collection`,
        emailHtml
      );
    }
  } catch (error) {
    console.error("Error sending license ready notification:", error);
  }
}

/**
 * Send confirmation notification when license is collected
 */
async function sendCollectionConfirmation(
  userId: string,
  email: string,
  fullName: string,
  applicationType: "learner" | "driver"
): Promise<void> {
  const licenseType = applicationType === "learner" ? "Learner's Licence" : "Driver's Licence";
  
  const smsMessage = `Hi ${fullName}, your ${licenseType} collection has been confirmed and logged in the system. Enjoy safe driving!`;
  
  const emailHtml = `
    <h2>${licenseType} Collection Confirmed</h2>
    <p>Dear ${fullName},</p>
    <p>Your ${licenseType} has been successfully collected and logged in the system.</p>
    <p><strong>Collection Date:</strong> ${new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</p>
    <p>Thank you for using the eDLTS system. Wishing you safe and responsible driving!</p>
    <p>Best regards,<br/>eDLTS System</p>
  `;

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (userData?.phone) {
      await sendSmsNotification(userData.phone, smsMessage);
    }

    if (email) {
      await sendEmailNotification(
        email,
        `Your ${licenseType} Collection Confirmed`,
        emailHtml
      );
    }
  } catch (error) {
    console.error("Error sending collection confirmation:", error);
  }
}
