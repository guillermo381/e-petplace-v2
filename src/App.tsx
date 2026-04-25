import React, { useState, useEffect } from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet,
  IonTabBar, IonTabButton, IonTabs, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { homeOutline, pawOutline, bagHandleOutline, cartOutline, personOutline, receiptOutline } from 'ionicons/icons';

import { supabase } from './lib/supabase';

import { CartProvider, useCart } from './context/CartContext';
import { GuestProvider, useGuest } from './context/GuestContext';
import { ThemeProvider } from './context/ThemeContext';
import RegisterPrompt    from './components/RegisterPrompt';
import GuestHeader       from './components/GuestHeader';
import FloatingCart      from './components/FloatingCart';
import Login             from './pages/Login';
import Welcome           from './pages/Welcome';
import Home              from './pages/Home';
import BioPet, { BioPetNew, BioPetDetail } from './pages/BioPet';
import Store             from './pages/Store';
import Profile           from './pages/Profile';
import Vet               from './pages/Vet';
import Adopcion          from './pages/Adopcion';
import Cart              from './pages/Cart';
import Checkout          from './pages/Checkout';
import MisPedidos        from './pages/MisPedidos';
import Onboarding        from './pages/Onboarding';
import ResetPassword     from './pages/ResetPassword';
import PrivacyPolicy     from './pages/legal/PrivacyPolicy';
import TermsOfService    from './pages/legal/TermsOfService';
import CookiesPolicy     from './pages/legal/CookiesPolicy';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';
import './index.css';

setupIonicReact({ mode: 'ios' });

/* ── Splash ──────────────────────────────────────────────────── */
const Splash: React.FC = () => (
  <div style={{
    background: '#000', height: '100vh', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
  }}>
    <div style={{
      width: 72, height: 72, borderRadius: 18,
      background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 36, boxShadow: '0 0 50px rgba(0,229,255,0.4)',
    }}>🐾</div>
    <p style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>e-PetPlace</p>
    <div className="pet-spin" style={{
      width: 28, height: 28, borderRadius: '50%',
      border: '3px solid rgba(0,229,255,0.2)', borderTopColor: '#00E5FF',
    }} />
  </div>
);

/* ── Tab carrito con badge ───────────────────────────────────── */
const CartTabButton: React.FC = () => {
  const { totalItems } = useCart();
  return (
    <IonTabButton tab="carrito" href="/carrito">
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        <IonIcon icon={cartOutline} />
        {totalItems > 0 && (
          <div style={{
            position: 'absolute', top: -6, right: -8,
            width: 16, height: 16, borderRadius: '50%',
            background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
            color: '#000', fontSize: 9, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>{totalItems > 9 ? '9+' : totalItems}</div>
        )}
      </div>
      <IonLabel>Carrito</IonLabel>
    </IonTabButton>
  );
};

/* ── Rutas autenticadas con tabs ─────────────────────────────── */
const AuthedContent: React.FC<{ session: Session }> = ({ session }) => (
  <IonTabs>
    <IonRouterOutlet animated={true}>
      <Route exact path="/home"        render={() => <Home       session={session} />} />
      <Route exact path="/mascotas"    render={() => <BioPet     session={session} />} />
      <Route exact path="/tienda"      render={() => <Store      session={session} />} />
      <Route exact path="/perfil"      render={() => <Profile    session={session} />} />
      <Route exact path="/carrito"     render={() => <Cart       session={session} />} />
      <Route exact path="/checkout"    render={() => <Checkout   session={session} />} />
      <Route exact path="/vet"         render={() => <Vet        session={session} />} />
      <Route exact path="/adopcion"    render={() => <Adopcion   session={session} />} />
      <Route exact path="/mis-pedidos" render={() => <MisPedidos session={session} />} />
      <Route exact path="/onboarding"  render={() => <Onboarding session={session} />} />
      <Route exact path="/privacidad"  render={() => <PrivacyPolicy />} />
      <Route exact path="/terminos"    render={() => <TermsOfService />} />
      <Route exact path="/cookies"     render={() => <CookiesPolicy />} />
      <Route exact path="/biopet/new" render={() => <BioPetNew session={session} />} />
      <Route exact path="/biopet/:id" render={(props) => {
        const id = props.match.params.id;
        if (!id || id === 'new') return <BioPetNew session={session} />;
        return <BioPetDetail session={session} petId={id} />;
      }} />
      <Route render={() => <Redirect to="/home" />} />
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="home"     href="/home">
        <IonIcon icon={homeOutline} /><IonLabel>Inicio</IonLabel>
      </IonTabButton>
      <IonTabButton tab="mascotas" href="/mascotas">
        <IonIcon icon={pawOutline} /><IonLabel>Mascotas</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tienda"   href="/tienda">
        <IonIcon icon={bagHandleOutline} /><IonLabel>Tienda</IonLabel>
      </IonTabButton>
      <CartTabButton />
      <IonTabButton tab="pedidos" href="/mis-pedidos">
        <IonIcon icon={receiptOutline} /><IonLabel>Pedidos</IonLabel>
      </IonTabButton>
      <IonTabButton tab="perfil"   href="/perfil">
        <IonIcon icon={personOutline} /><IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

/* ── Tabs invitado (3 tabs simplificados) ────────────────────── */
const GuestTabsEntrar: React.FC = () => {
  const { exitGuest } = useGuest();
  const history = useHistory();

  const handleEntrar = () => {
    exitGuest();
    history.push('/login');
  };

  return (
    <IonTabButton tab="entrar" onClick={handleEntrar}>
      <IonIcon icon={personOutline} style={{ color: '#00E5FF' }} />
      <IonLabel style={{ color: '#00E5FF' }}>Entrar</IonLabel>
    </IonTabButton>
  );
};

const GuestContent: React.FC = () => (
  <>
    <GuestHeader />
    <IonTabs>
      <IonRouterOutlet animated={true}>
        <Route exact path="/tienda"   render={() => <Store    session={null} />} />
        <Route exact path="/vet"      render={() => <Vet      session={null} />} />
        <Route exact path="/adopcion" render={() => <Adopcion session={null} />} />
        <Route exact path="/carrito"   render={() => <Cart     session={null} />} />
        <Route exact path="/checkout"  render={() => <Checkout session={null} />} />
        <Route exact path="/privacidad" render={() => <PrivacyPolicy />} />
        <Route exact path="/terminos"   render={() => <TermsOfService />} />
        <Route exact path="/cookies"    render={() => <CookiesPolicy />} />
        <Route render={() => <Redirect to="/tienda" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="tienda" href="/tienda">
          <IonIcon icon={bagHandleOutline} /><IonLabel>Tienda</IonLabel>
        </IonTabButton>
        <IonTabButton tab="adopcion" href="/adopcion">
          <IonIcon icon={pawOutline} /><IonLabel>Adopción</IonLabel>
        </IonTabButton>
        <GuestTabsEntrar />
      </IonTabBar>
    </IonTabs>
  </>
);

/* ── Bridge: prompt de registro para invitados ───────────────── */
const GuestPromptBridge: React.FC<{ session: Session | null }> = ({ session }) => {
  const { showRegisterPrompt, dismissRegisterPrompt } = useCart();
  if (session || !showRegisterPrompt) return null;
  return <RegisterPrompt onDismiss={dismissRegisterPrompt} />;
};

/* ── Contenido principal (dentro del router, puede usar useLocation) ── */
const AppContent: React.FC<{ session: Session | null }> = ({ session }) => {
  const location = useLocation();
  const { guestMode } = useGuest();

  // Rutas de auth siempre públicas — nunca interceptadas por guestMode
  const isAuthRoute = ['login', 'welcome', 'reset-password']
    .some(p => location.pathname.startsWith(`/${p}`));

  if (session) return <AuthedContent session={session} />;

  if (guestMode && !isAuthRoute) return <GuestContent />;

  return (
    <IonRouterOutlet animated={true}>
      <Route exact path="/reset-password" render={() => <ResetPassword />} />
      <Route exact path="/welcome"        render={() => <Welcome />} />
      <Route exact path="/login"          render={() => <Login />} />
      <Route exact path="/privacidad"     render={() => <PrivacyPolicy />} />
      <Route exact path="/terminos"       render={() => <TermsOfService />} />
      <Route exact path="/cookies"        render={() => <CookiesPolicy />} />
      <Route render={() => <Redirect to="/welcome" />} />
    </IonRouterOutlet>
  );
};

/* ── App interno (usa los contextos) ─────────────────────────── */
const AppInner: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { exitGuest } = useGuest();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { supabase.auth.signOut(); setSession(null); }
      else {
        if (session) exitGuest();
        setSession(session);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) exitGuest();
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Splash />;

  return (
    <IonApp>
      <IonReactRouter>
        <AppContent session={session} />
        <GuestPromptBridge session={session} />
        <FloatingCart />
      </IonReactRouter>
    </IonApp>
  );
};

/* ── App raíz: proveedores ───────────────────────────────────── */
const App: React.FC = () => (
  <ThemeProvider>
    <GuestProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </GuestProvider>
  </ThemeProvider>
);

export default App;
