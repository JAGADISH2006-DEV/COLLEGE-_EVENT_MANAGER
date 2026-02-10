import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { importCSV } from '../csvUtils';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

const ImportCSVModal = () => {
    const modals = useAppStore((state) => state.modals);
    const closeModal = useAppStore((state) => state.closeModal);
    const isOpen = modals.importCSV;

    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'text/csv') {
            setFile(selectedFile);
            setResult(null);
        } else {
            alert('Please select a valid CSV file');
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsImporting(true);

        try {
            const importResult = await importCSV(file);
            setResult(importResult);

            if (importResult.success) {
                setTimeout(() => {
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Import error:', error);
            setResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        closeModal('importCSV');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={handleClose}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Import from CSV
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {!result ? (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Upload a CSV file exported from Excel or Google Sheets. The system will automatically detect and map columns.
                                </p>

                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Expected Columns:</h4>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <p>• College Name, Event Name, Event Type</p>
                                        <p>• Registration Deadline, Start Date, End Date</p>
                                        <p>• Prize, Fee, Location, Contact, etc.</p>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <FileSpreadsheet size={48} className="text-green-500 mb-3" />
                                            <p className="text-gray-900 dark:text-white font-medium">{file.name}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload size={48} className="text-gray-400 mb-3" />
                                            <p className="text-gray-900 dark:text-white font-medium mb-1">
                                                Click to upload CSV file
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                or drag and drop
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                {result.success ? (
                                    <>
                                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            Import Successful!
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Successfully imported {result.count} events
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
                                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            Import Failed
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {result.error}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!result && (
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900">
                            <button
                                onClick={handleClose}
                                className="btn btn-outline"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || isImporting}
                                className="btn btn-primary"
                            >
                                {isImporting ? 'Importing...' : 'Import Events'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportCSVModal;
