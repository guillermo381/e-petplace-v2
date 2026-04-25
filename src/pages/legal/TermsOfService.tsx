import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const UPDATED = '25 de abril de 2026';

const Section: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div style={{
    background: 'var(--bg-card)', borderRadius: 14,
    border: '1px solid var(--border-color)', padding: '18px 18px 16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <div style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: 8,
        background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, color: '#000',
      }}>{n}</div>
      <h2 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{title}</h2>
    </div>
    <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.7, paddingLeft: 36 }}>
      {children}
    </div>
  </div>
);

const TermsOfService: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>

          {/* Header */}
          <div style={{
            padding: '52px 20px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--border-color)',
          }}>
            <button onClick={() => history.goBack()} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 10, width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: 'var(--text-primary)', flexShrink: 0,
            }}>←</button>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 800, margin: 0 }}>
                Términos y Condiciones
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '2px 0 0' }}>
                Última actualización: {UPDATED}
              </p>
            </div>
          </div>

          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Intro */}
            <div style={{
              background: 'rgba(255,45,155,0.06)', borderRadius: 12,
              border: '1px solid rgba(255,45,155,0.2)', padding: '14px 16px',
            }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                Al usar <strong style={{ color: '#FF2D9B' }}>e-PetPlace</strong> aceptas estos términos.
                Si no estás de acuerdo, por favor no uses la plataforma.
                Estos términos se rigen por la legislación vigente de la <strong>República del Ecuador</strong>.
              </p>
            </div>

            <Section n={1} title="Objeto y Aceptación">
              <p style={{ margin: 0 }}>
                e-PetPlace es una plataforma digital que conecta a dueños de mascotas con productos,
                servicios veterinarios y procesos de adopción. El uso de la plataforma implica la
                aceptación íntegra de estos Términos y Condiciones, así como de nuestra Política de Privacidad.
              </p>
            </Section>

            <Section n={2} title="Registro y Cuenta de Usuario">
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Debes ser mayor de 18 años para registrarte.</li>
                <li style={{ marginBottom: 6 }}>La información proporcionada debe ser veraz, completa y actualizada.</li>
                <li style={{ marginBottom: 6 }}>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
                <li style={{ marginBottom: 6 }}>Debes notificarnos inmediatamente si detectas uso no autorizado de tu cuenta.</li>
                <li>Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</li>
              </ul>
            </Section>

            <Section n={3} title="Uso de la Plataforma">
              <p style={{ margin: '0 0 8px' }}>Está prohibido:</p>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Usar la plataforma para actividades ilegales o fraudulentas.</li>
                <li style={{ marginBottom: 6 }}>Publicar información falsa sobre mascotas en adopción.</li>
                <li style={{ marginBottom: 6 }}>Acceder a datos de otros usuarios sin autorización.</li>
                <li style={{ marginBottom: 6 }}>Realizar scraping, bots o acceso automatizado no autorizado.</li>
                <li>Reproducir o distribuir el contenido de la plataforma sin permiso expreso.</li>
              </ul>
            </Section>

            <Section n={4} title="Compras y Pagos">
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Guest checkout:</strong> Permitimos compras
                  sin cuenta. En ese caso, los datos de contacto proporcionados se usarán exclusivamente
                  para gestionar el pedido.
                </li>
                <li style={{ marginBottom: 6 }}>Los precios están en USD e incluyen IVA cuando aplica.</li>
                <li style={{ marginBottom: 6 }}>El pago se procesa de forma segura mediante proveedores certificados.</li>
                <li style={{ marginBottom: 6 }}>Recibirás confirmación de compra por email al correo proporcionado.</li>
                <li>e-PetPlace se reserva el derecho de cancelar órdenes sospechosas de fraude.</li>
              </ul>
            </Section>

            <Section n={5} title="Política de Devoluciones">
              <div style={{ padding: '10px 14px', background: 'rgba(0,245,160,0.06)', borderRadius: 10, border: '1px solid rgba(0,245,160,0.2)', marginBottom: 10 }}>
                <p style={{ color: '#00F5A0', fontWeight: 700, margin: 0, fontSize: 13 }}>
                  ✓ 7 días para devolución de productos físicos
                </p>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Tienes 7 días calendario desde la recepción del producto para solicitar devolución.</li>
                <li style={{ marginBottom: 6 }}>El producto debe estar en su empaque original, sin uso y en perfectas condiciones.</li>
                <li style={{ marginBottom: 6 }}>Productos de alimentación, medicamentos y artículos de higiene no son devolvibles una vez abiertos.</li>
                <li style={{ marginBottom: 6 }}>Para iniciar una devolución escribe a <strong style={{ color: '#00E5FF' }}>soporte@epetplace.com</strong>.</li>
                <li>El reembolso se procesará en 5-10 días hábiles tras recibir el producto.</li>
              </ul>
            </Section>

            <Section n={6} title="Servicios Veterinarios">
              <div style={{ padding: '10px 14px', background: 'rgba(255,230,0,0.06)', borderRadius: 10, border: '1px solid rgba(255,230,0,0.2)', marginBottom: 10 }}>
                <p style={{ color: '#FFE600', fontWeight: 700, margin: 0, fontSize: 12 }}>
                  ⚠️ e-PetPlace actúa como intermediario, no como proveedor directo de servicios veterinarios.
                </p>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Las citas veterinarias se coordinan a través de la plataforma con veterinarios independientes.</li>
                <li style={{ marginBottom: 6 }}>e-PetPlace no se hace responsable de diagnósticos, tratamientos ni resultados médicos.</li>
                <li style={{ marginBottom: 6 }}>El veterinario que presta el servicio asume plena responsabilidad profesional.</li>
                <li>Para cancelar una cita con al menos 24 horas de anticipación, escríbenos a soporte.</li>
              </ul>
            </Section>

            <Section n={7} title="Adopción de Mascotas">
              <div style={{ padding: '10px 14px', background: 'rgba(167,139,250,0.06)', borderRadius: 10, border: '1px solid rgba(167,139,250,0.2)', marginBottom: 10 }}>
                <p style={{ color: '#A78BFA', fontWeight: 700, margin: 0, fontSize: 12 }}>
                  🐾 e-PetPlace facilita el proceso de adopción pero no garantiza su resultado.
                </p>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                <li style={{ marginBottom: 6 }}>Las adopciones son coordinadas entre particulares o refugios y adoptantes, sin costo para las partes.</li>
                <li style={{ marginBottom: 6 }}>e-PetPlace no verifica el estado de salud de los animales listados.</li>
                <li style={{ marginBottom: 6 }}>Está prohibido publicar anuncios de venta de animales en la sección de adopción.</li>
                <li>Denunciar listados sospechosos a <strong style={{ color: '#00E5FF' }}>adopcion@epetplace.com</strong>.</li>
              </ul>
            </Section>

            <Section n={8} title="Propiedad Intelectual">
              <p style={{ margin: 0 }}>
                El nombre, logo, diseño, código y contenido de e-PetPlace son propiedad exclusiva de la empresa.
                Queda prohibida su reproducción, distribución o uso comercial sin autorización escrita.
                Los usuarios conservan la titularidad de las fotos e información que publiquen sobre sus mascotas.
              </p>
            </Section>

            <Section n={9} title="Limitación de Responsabilidad">
              <p style={{ margin: 0 }}>
                e-PetPlace no será responsable por daños indirectos, incidentales o consecuentes derivados
                del uso de la plataforma. La responsabilidad total de e-PetPlace no excederá el monto
                pagado por el usuario en los últimos 30 días. La plataforma se ofrece "tal cual" sin
                garantías de disponibilidad ininterrumpida.
              </p>
            </Section>

            <Section n={10} title="Modificaciones y Terminación">
              <p style={{ margin: 0 }}>
                Nos reservamos el derecho de modificar estos términos en cualquier momento.
                Los cambios sustanciales serán notificados con al menos 15 días de anticipación.
                Puedes terminar tu relación con e-PetPlace eliminando tu cuenta desde el perfil.
              </p>
            </Section>

            <Section n={11} title="Ley Aplicable y Jurisdicción">
              <p style={{ margin: 0 }}>
                Estos términos se rigen por las leyes de la <strong style={{ color: 'var(--text-primary)' }}>República del Ecuador</strong>.
                Cualquier disputa será sometida a los tribunales competentes de la ciudad de Quito, Ecuador,
                previa instancia de mediación según la Ley de Arbitraje y Mediación vigente.
              </p>
            </Section>

            <Section n={12} title="Contacto Legal">
              <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                <p style={{ margin: '3px 0', color: 'var(--text-primary)', fontSize: 13 }}>
                  📧 <strong>legal@epetplace.com</strong>
                </p>
                <p style={{ margin: '3px 0', color: 'var(--text-secondary)', fontSize: 12 }}>
                  Tiempo de respuesta: hasta 10 días hábiles
                </p>
              </div>
            </Section>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsOfService;
