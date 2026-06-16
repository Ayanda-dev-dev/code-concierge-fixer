import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Trash2, Eye, Download, CheckCircle, AlertCircle, FileText, Image, Loader } from 'lucide-react';
import { AnimatedButton, AnimatedCard, FloatingParticles } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants } from '@/lib/animations';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  uploadDate?: string;
}

export const UploadDocumentsPage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [documentType, setDocumentType] = useState('id');

  const documentTypes = [
    { value: 'id', label: '🆔 National ID', description: 'Front and back copy of your ID' },
    { value: 'passport', label: '📕 Passport', description: 'Passport copy' },
    { value: 'residence', label: '🏠 Proof of Residence', description: 'Recent utility bill or lease' },
    { value: 'medical', label: '⚕️ Medical Certificate', description: 'Form 307 from doctor' },
    { value: 'affidavit', label: '📄 Affidavit', description: 'Notarized affidavit if needed' },
    { value: 'other', label: '📎 Other Documents', description: 'Any other supporting documents' },
  ];

  const previousDocuments = [
    {
      id: 'prev1',
      name: 'National_ID_Front.pdf',
      type: 'ID Copy',
      size: 2.4,
      uploadDate: '2024-06-10',
      status: 'approved',
    },
    {
      id: 'prev2',
      name: 'Proof_of_Residence.pdf',
      type: 'Utility Bill',
      size: 1.8,
      uploadDate: '2024-06-12',
      status: 'verified',
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newFile: UploadedFile = {
        id,
        name: file.name,
        type: documentType,
        size: file.size / 1024 / 1024, // Convert to MB
        progress: 0,
        status: 'uploading',
      };

      setFiles((prev) => [...prev, newFile]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, progress: 100, status: Math.random() > 0.2 ? 'completed' : 'error', uploadDate: new Date().toISOString().split('T')[0] }
                : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, progress: Math.min(progress, 99) } : f
            )
          );
        }
      }, 500);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden py-12 px-4">
      {/* Floating Particles */}
      <FloatingParticles count={15} colors={['#2563eb', '#10b981', '#f59e0b']} />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.a href="/" className="flex items-center gap-2 font-bold text-2xl" whileHover={{ scale: 1.05 }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              🚗
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">eDLTS</span>
          </motion.a>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pt-20">
        <motion.div
          className="mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-2">Upload Documents</h1>
            <p className="text-slate-400 text-lg">Securely upload your required documents</p>
          </motion.div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Document Type Selector */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-4">Select Document Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {documentTypes.map((doc, i) => (
                  <motion.button
                    key={doc.value}
                    onClick={() => setDocumentType(doc.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      documentType === doc.value
                        ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="text-2xl mb-2">{doc.label.split(' ')[0]}</div>
                    <h4 className="font-semibold text-sm mb-1">{doc.label}</h4>
                    <p className="text-xs text-slate-400">{doc.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Drag and Drop Area */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-4">Upload Your Files</h2>

              <motion.div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/30'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <label className="cursor-pointer block p-12">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                  />

                  <motion.div
                    className="text-center"
                    animate={dragActive ? { scale: 1.05 } : { scale: 1 }}
                  >
                    <motion.div
                      className="inline-block p-4 rounded-lg bg-blue-500/10 mb-4"
                      animate={{ y: dragActive ? -5 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Upload className="w-12 h-12 text-blue-400" />
                    </motion.div>

                    <h3 className="text-xl font-bold mb-2">Drop files here or click to browse</h3>
                    <p className="text-slate-400 mb-4">Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)</p>

                    <AnimatedButton variant="primary" size="md">
                      Select Files
                    </AnimatedButton>
                  </motion.div>
                </label>
              </motion.div>

              {/* Upload Info */}
              <motion.div
                className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Tips for successful upload:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Ensure documents are clear and readable</li>
                    <li>• All pages should be included</li>
                    <li>• Keep files under 10MB each</li>
                    <li>• Multiple files can be uploaded at once</li>
                  </ul>
                </div>
              </motion.div>
            </motion.div>

            {/* Uploading Files */}
            {files.length > 0 && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold mb-4">
                  Uploads
                  <span className="text-sm text-slate-400 ml-2">({files.length} file{files.length !== 1 ? 's' : ''})</span>
                </h2>

                <div className="space-y-4">
                  <AnimatePresence>
                    {files.map((file, i) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
                      >
                        <div className="flex items-start gap-4">
                          {/* File Icon */}
                          <motion.div
                            className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0"
                            animate={file.status === 'uploading' ? { rotate: 360 } : {}}
                            transition={file.status === 'uploading' ? { repeat: Infinity, duration: 2, ease: 'linear' } : {}}
                          >
                            {file.status === 'uploading' ? (
                              <Loader className="w-6 h-6 text-blue-400" />
                            ) : file.status === 'completed' ? (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            ) : (
                              <AlertCircle className="w-6 h-6 text-red-400" />
                            )}
                          </motion.div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold truncate">{file.name}</h4>
                              {file.status !== 'uploading' && (
                                <motion.button
                                  onClick={() => removeFile(file.id)}
                                  className="text-slate-400 hover:text-red-400 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="w-5 h-5" />
                                </motion.button>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                              <span>{formatFileSize(file.size)}</span>
                              <span>
                                {file.status === 'uploading'
                                  ? `${Math.round(file.progress)}%`
                                  : file.status === 'completed'
                                    ? 'Completed'
                                    : 'Failed'}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${
                                  file.status === 'completed'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                    : file.status === 'error'
                                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${file.progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Storage Info */}
                <motion.div
                  className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">Total Storage Used</span>
                    <span className="text-sm font-semibold">{formatFileSize(totalSize)} / 100 MB</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${(totalSize / 100) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Previous Documents */}
          <motion.div
            className="space-y-6"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div>
              <h2 className="text-2xl font-bold mb-4">Previous Uploads</h2>

              <div className="space-y-4">
                {previousDocuments.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ x: 5, backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-400 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{doc.uploadDate} • {doc.size} MB</p>
                      </div>
                    </div>

                    <motion.span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        doc.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                    >
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </motion.span>

                    <div className="flex gap-2 mt-3">
                      <motion.button
                        className="flex-1 py-2 text-xs rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                      <motion.button
                        className="flex-1 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                className="mt-6 p-4 bg-gradient-to-br from-green-600/20 to-green-700/20 border border-green-500/30 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-300 mb-1">Documents Verified</p>
                    <p className="text-xs text-green-300/75">Your previously uploaded documents have been verified by our team.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <AnimatedButton variant="primary" size="lg" className="w-full justify-center">
                Proceed to Next Step
              </AnimatedButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentsPage;
