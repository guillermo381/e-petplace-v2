import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet,
  IonTabBar, IonTabButton, IonTabs, setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Session } from '@supabase/supabase-js';
import { homeOutline, pawOutline, bagHandleOutline, cartOutline, personOutline } from 'ionicons/icons';

import { supabase } from './lib/supabase';
import { CartProvider, useCart } from './context/CartContext';
import Login              from './pages/Login';
import Home               from './pages/Home';
import BioPet, { BioPetNew, BioPetDetail } from './pages/BioPet';
import Store              from './pages/Store';
import Profile            from './pages/Profile';
import Vet                from './pages/Vet';
import Adopcion           from './pages/Adopcion';
import Cart               from './pages/Cart';
import Checkout           from './pages/Checkout';
import ResetPassword      from './pages/ResetPassword';

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
    background:'#000', height:'100vh', display:'flex',
    flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16,
  }}>
    <div style={{
      width:72, height:72, borderRadius:18,
      background:'linear-gradient(135deg,#FF2D9B,#00E5FF)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:36, boxShadow:'0 0 50px rgba(0,229,255,0.4)',
    }}>🐾</div>
    <p style={{ color:'#fff', fontWeight:800, fontSize:22 }}>e-PetPlace</p>
    <div className="pet-spin" style={{
      width:28, height:28, borderRadius:'50%',
      border:'3px solid rgba(0,229,255,0.2)', borderTopColor:'#00E5FF',
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
    <IonRouterOutlet>
      <Route exact path="/home"     render={() => <Home     session={session} />} />
      <Route exact path="/mascotas" render={() => <BioPet   session={session} />} />
      <Route exact path="/tienda"   render={() => <Store    session={session} />} />
      <Route exact path="/perfil"   render={() => <Profile  session={session} />} />
      <Route exact path="/carrito"  render={() => <Cart     session={session} />} />
      <Route exact path="/checkout" render={() => <Checkout session={session} />} />
      <Route exact path="/vet"      render={() => <Vet      session={session} />} />
      <Route exact path="/adopcion" render={() => <Adopcion session={session} />} />
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
      <IonTabButton tab="perfil"   href="/perfil">
        <IonIcon icon={personOutline} /><IonLabel>Perfil</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

/* ── App ─────────────────────────────────────────────────────── */
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { supabase.auth.signOut(); setSession(null); }
      else setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <Splash />;

  return (
    <IonApp>
      <CartProvider>
        <IonReactRouter>
          {!session ? (
            <IonRouterOutlet>
              <Route exact path="/reset-password" render={() => <ResetPassword />} />
              <Route exact path="/tienda"   render={() => <Store    session={null} />} />
              <Route exact path="/carrito"  render={() => <Cart     session={null} />} />
              <Route exact path="/checkout" render={() => <Checkout session={null} />} />
              <Route render={() => <Login />} />
            </IonRouterOutlet>
          ) : (
            <AuthedContent session={session} />
          )}
        </IonReactRouter>
      </CartProvider>
    </IonApp>
  );
};

export default App;
