import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        Términos y Condiciones
                    </h1>

                    <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                1. Aceptación de los Términos
                            </h2>
                            <p>
                                Al acceder y utilizar SAGO-FACTU, usted acepta estar sujeto a estos términos y condiciones de uso.
                                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                2. Descripción del Servicio
                            </h2>
                            <p>
                                SAGO-FACTU es una plataforma de facturación electrónica que permite a las empresas generar,
                                gestionar y enviar facturas electrónicas cumpliendo con la normativa fiscal de Panamá.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                3. Registro y Cuenta de Usuario
                            </h2>
                            <p>
                                Para utilizar nuestros servicios, debe crear una cuenta proporcionando información precisa y completa.
                                Usted es responsable de mantener la confidencialidad de su contraseña y de todas las actividades
                                que ocurran bajo su cuenta.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                4. Uso Aceptable
                            </h2>
                            <p>
                                Usted se compromete a utilizar SAGO-FACTU únicamente para fines legales y de acuerdo con todas
                                las leyes y regulaciones aplicables. No debe:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Utilizar el servicio para actividades fraudulentas o ilegales</li>
                                <li>Intentar acceder a áreas no autorizadas del sistema</li>
                                <li>Interferir con el funcionamiento del servicio</li>
                                <li>Compartir su cuenta con terceros no autorizados</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                5. Privacidad y Protección de Datos
                            </h2>
                            <p>
                                Nos comprometemos a proteger su información personal de acuerdo con nuestra Política de Privacidad
                                y las leyes de protección de datos aplicables. Los datos fiscales y de facturación se manejan
                                con los más altos estándares de seguridad.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                6. Tarifas y Pagos
                            </h2>
                            <p>
                                El uso de SAGO-FACTU puede estar sujeto a tarifas según el plan seleccionado.
                                Todas las tarifas se cobrarán de acuerdo con el plan de suscripción elegido y
                                se facturarán por adelantado.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                7. Limitación de Responsabilidad
                            </h2>
                            <p>
                                SAGO-FACTU se proporciona "tal cual" sin garantías de ningún tipo. No seremos responsables
                                por daños indirectos, incidentales o consecuentes que resulten del uso o la imposibilidad
                                de usar el servicio.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                8. Modificaciones
                            </h2>
                            <p>
                                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                                Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                                9. Contacto
                            </h2>
                            <p>
                                Si tiene preguntas sobre estos términos, puede contactarnos a través de nuestro
                                correo electrónico de soporte.
                            </p>
                        </section>

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Última actualización: {new Date().toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
