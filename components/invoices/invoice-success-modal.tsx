'use client';

import { CheckCircle, Download, ArrowLeft, FileText, Mail, Plus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { useState } from "react";

interface Props {
    isOpen: boolean;
    invoiceNumber: string;
    cufe: string;
    qrCodeUrl: string;
    pdfBase64?: string;
    onClose?: () => void;
    onNewInvoice?: () => void;
}

export const InvoiceSuccessModal = ({
    isOpen,
    cufe,
    qrCodeUrl,
    invoiceNumber,
    pdfBase64,
    onClose,
    onNewInvoice
}: Props) => {
    const [copyFeedback, setCopyFeedback] = useState(false);

    if (!isOpen) return null;

    const handleDownloadPdf = () => {
        if (!pdfBase64) return;

        // Utilidad para convertir Base64 a descarga sin ir al servidor de nuevo
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfBase64}`;
        link.download = `Factura-${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyCufe = () => {
        navigator.clipboard.writeText(cufe);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl text-center border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">

                <div className="mx-auto bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">¡Factura Emitida!</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
                    La DGI ha autorizado el documento <span className="font-semibold text-gray-900 dark:text-white">{invoiceNumber}</span>
                </p>

                {/* Zona Fiscal Visual */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="flex justify-center mb-6 bg-white p-4 rounded-lg w-fit mx-auto shadow-sm">
                        {/* Renderiza el QR basándose en el string que guarda HKA */}
                        <QRCodeSVG value={qrCodeUrl} size={160} />
                    </div>

                    <div className="text-left">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                            Código Único de Factura Electrónica (CUFE)
                        </label>
                        <div
                            onClick={handleCopyCufe}
                            className="group relative cursor-pointer font-mono text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors break-all"
                        >
                            {cufe}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                                    {copyFeedback ? 'Copiado!' : 'Copiar'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={!pdfBase64}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={20} />
                        Descargar PDF Original
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onNewInvoice}
                            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            <Plus size={18} /> Nueva Factura
                        </button>
                        <Link href="/dashboard/facturas" className="w-full">
                            <button
                                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                            >
                                <FileText size={18} /> Ver Historial
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
