# Document Upload API - Catbox Implementation & Testing Guide

## ✅ What Has Been Implemented

### 1. Catbox File Hosting Integration
- Cloud file hosting via Catbox (catbox.moe)
- **No API key required** - completely free
- Upload endpoint: `https://files.catbox.moe/upload.php`
- Free tier: Unlimited uploads, 200MB max file size
- Files never expire
- No registration needed

### 2. Upload Utility Functions
**File:** `src/lib/firebase.ts`
- `uploadDocument()` - Upload file to Catbox with validation

**Validation:**
- Max file size: 50MB (Catbox supports 200MB, but we limit for safety)
- Allowed formats: PDF, JPG, PNG
- Returns: Download URL + metadata
- No server backend needed (direct client-side upload)

### 3. Document Upload Component
**File:** `src/components/DocumentUpload.tsx`
- Reusable upload component
- File input with validation
- Upload progress indicator
- Error handling with toast notifications
- Success state with file name display

### 4. Updated Application Wizard
**File:** `src/routes/apply.$appId.tsx`
- Modified Documents step (Step 5/7) to use Catbox uploads
- Document types supported:
  - Certified copy of ID
  - Proof of residence (≤3 months)
  - Eye certificate (digitally signed)
  - Valid Learner's certificate (driver's only)
- Stores URL + upload timestamp in application data

### 5. Enhanced Data Model
**File:** `src/lib/edlts-store.ts`
- Updated documents schema to support:
  - Boolean flags (for backward compatibility)
  - Upload objects: `{ url: string, uploadedAt: number }`
- Automatic merging with existing document data

---

## 🧪 How to Test

### Step 1: Access the Application
1. Open browser and navigate to `http://localhost:5173`
2. If prompted, log in with any credentials (demo mode)
3. Click "New application" from dashboard
4. Select "Learner's Licence" or "Driver's Licence"

### Step 2: Navigate to Documents Step
1. Click through steps: ID Scan → Photos → Details → Signature
2. On Documents step (Step 5/7), you'll see the upload interface:
   ```
   ┌──────────────────────────────────────────────┐
   │ 📄 Certified copy of ID            [Upload]  │
   │    PDF, JPG or PNG · max 50MB                │
   │    Powered by Catbox                         │
   └──────────────────────────────────────────────┘
   ```

### Step 3: Upload a Test Document
1. Click "Upload" button for first document
2. Select any PDF, JPG, or PNG file (< 50MB)
3. Observe:
   - Button shows "Uploading..." with spinner
   - Toast notification appears: "Document uploaded successfully"
   - On success: Button shows "✓ Uploaded" + file name
   - Green success state background
   - Document name displayed

### Step 4: Verify Upload Success
**In Browser Console (F12):**
```javascript
// Check stored data
const appId = 'YOUR_APP_ID';
const apps = JSON.parse(localStorage.getItem('edlts-apps') || '[]');
const app = apps.find(a => a.id === appId);
console.log(app.documents);
```

**Expected Output:**
```javascript
{
  certifiedId: {
    url: "https://files.catbox.moe/abc123def456.jpg",
    uploadedAt: 1718108245000
  }
}
```

**Verify URL is Accessible:**
- Copy the URL from console
- Open in new browser tab
- File should display/download immediately

### Step 5: Test Multiple Documents
1. Upload remaining documents
2. For driver's licence: also upload "Valid Learner's certificate"
3. All should show green success states with file names
4. Verify all URLs are accessible by opening in new tabs

### Step 6: Continue Application
1. Click "Continue" to move to Payment step
2. Uploads persist through wizard steps
3. On final submission, uploads are saved with application

---

## 📁 File Structure

```
src/
├── lib/
│   └── firebase.ts              (← Updated with Catbox upload)
├── components/
│   └── DocumentUpload.tsx       (← Upload component)
└── routes/
    └── apply.$appId.tsx        (← Updated DocsStep)
```

---

## 🔗 How Catbox Works

1. **Client-Side Upload**: Files upload directly from browser to Catbox
2. **No Backend Required**: No server code needed
3. **Instant URLs**: Get download link immediately after upload
4. **Public URLs**: Files accessible anywhere with link
5. **No Expiration**: Files stored permanently (unless explicitly deleted)

Upload Flow:
```
Browser → FormData → Catbox API → Download URL → App Storage
```

---

## ✨ Features Implemented

✅ **Free File Hosting**: Catbox (no subscription, no API key)
✅ **Large File Support**: Up to 50MB per file
✅ **Direct Upload**: Client-side, no backend needed
✅ **File Validation**: Type and size checks
✅ **Error Handling**: User-friendly error messages
✅ **Progress Indication**: Loading states during upload
✅ **Success Feedback**: Visual confirmation + file name
✅ **Data Persistence**: Uploads stored with application
✅ **URL Storage**: Download links for later retrieval
✅ **Metadata**: Upload timestamp tracking

---

## 🔒 How Files Are Managed

### Storage
- Files uploaded directly to Catbox servers
- URL stored in application data (localStorage)
- No files stored locally in Firebase or your server

### Access
- Download URLs are public (anyone with link can access)
- For production: Add access control via middleware

### Deletion
- Files persist on Catbox permanently
- Can be deleted manually via Catbox API if needed
- Contact Catbox for bulk deletion

---

## 🐛 Troubleshooting

### Upload button doesn't work
- Check browser console (F12) for errors
- Verify file is < 50MB
- Check file format (PDF, JPG, PNG only)
- Check internet connection

### File size error
- File exceeds 50MB limit
- Try compressing image/PDF
- Use: ImageOptimizer, TinyPNG, or similar

### "Upload failed" error
- Network connection issue
- Catbox server temporarily down (rare)
- Try again in 30 seconds
- Try different file

### Uploaded file not accessible
- Wait 5-10 seconds for Catbox to process
- Refresh page
- Try opening URL directly in new tab
- Check if URL copied correctly

### "Invalid response from Catbox"
- Catbox API might have changed
- Check Catbox status: catbox.moe
- Try upload again
- Contact support if persistent

---

## 🚀 Next Steps (After Testing)

Once upload functionality is confirmed working:

1. **Priority 2**: Payment Processing API
   - Integrate payment gateway (Payfast, Stripe)
   - Handle payment verification
   - Mark application as paid

2. **Priority 3**: SMS/Email Notifications
   - Send upload confirmation SMS
   - Email receipt of uploaded documents
   - Status update notifications

3. **Priority 4**: Biometric Verification
   - Compare uploaded photos
   - ID OCR processing
   - Liveness detection

4. **Priority 5**: Test Scheduling API
   - Real calendar integration
   - Centre availability management
   - Slot booking logic

---

## 📝 Test Checklist

- [ ] Can access application wizard
- [ ] Documents step displays correctly
- [ ] Can select and upload file
- [ ] Upload shows progress indicator
- [ ] Success toast notification appears
- [ ] Button shows "✓ Uploaded"
- [ ] File name displays correctly
- [ ] Can upload all required documents
- [ ] Can continue to next step
- [ ] Data persists after page refresh
- [ ] URL is accessible in new tab
- [ ] Multiple files upload independently
- [ ] Error handling works (oversized file, wrong format)
- [ ] Works on mobile browser

---

**Questions or issues? Check browser console (F12) for detailed error messages.**
