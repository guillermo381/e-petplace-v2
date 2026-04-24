import React, { useState, useEffect, useMemo } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  imagen_url?: string;
  descripcion?: string;
  para_especie: string;
}

interface Props { session: Session | null }

const CATEGORIAS = ['Todos', 'Alimento', 'Juguetes', 'Salud', 'Accesorios', 'Higiene'];
const CAT_EMOJI: Record<string, string> = {
  Todos:'🛍️', Alimento:'🍖', Juguetes:'🎾', Salud:'💊', Accesorios:'🎀', Higiene:'🛁',
};

const Store: React.FC<Props> = ({ session }) => {
  const history = useHistory();
  const { addToCart, totalItems } = useCart();
  const [productos,    setProductos]    = useState<Producto[]>([]);
  const [recomendados, setRecomendados] = useState<Producto[]>([]);
  const [categoria,    setCategoria]    = useState('Todos');
  const [busqueda,     setBusqueda]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [toast,        setToast]        = useState('');
  const [pendingProduct, setPendingProduct] = useState<Producto | null>(null);
  const [showGuestModal,  setShowGuestModal]  = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('productos').select('*').order('nombre');
      if (data) {
        setProductos(data as Producto[]);
        if (session) {
          const { data: mascs } = await supabase
            .from('mascotas').select('especie').eq('user_id', session.user.id);
          if (mascs && mascs.length > 0) {
            const especies = mascs.map((m: { especie: string }) => m.especie);
            const recs = (data as Producto[])
              .filter(p => especies.includes(p.para_especie) || p.para_especie === 'todos')
              .slice(0, 6);
            setRecomendados(recs);
          }
        }
      }
      setLoading(false);
    };
    fetch();
  }, [session]);

  const filtrados = useMemo(() => {
    let list = productos;
    if (categoria !== 'Todos')
      list = list.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [productos, categoria, busqueda]);

  const doAddToCart = (p: Producto) => {
    addToCart({
      producto_id:  p.id,
      nombre:       p.nombre,
      precio:       p.precio,
      imagen_emoji: CAT_EMOJI[p.categoria] ?? '📦',
    });
    setToast(`¡${p.nombre} agregado al carrito! 🛒`);
    setTimeout(() => setToast(''), 2200);
  };

  const handleAdd = (p: Producto) => {
    if (!session) {
      setPendingProduct(p);
      setShowGuestModal(true);
    } else {
      doAddToCart(p);
    }
  };

  const handleGuestAdd = () => {
    if (pendingProduct) doAddToCart(pendingProduct);
    setShowGuestModal(false);
    setPendingProduct(null);
  };

  const handleGuestLogin = () => {
    setShowGuestModal(false);
    history.replace('/');
  };

  const ProductCard = ({ p }: { p: Producto }) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid #1e1e1e' }}>
      {p.imagen_url ? (
        <img src={p.imagen_url} alt={p.nombre} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-4xl" style={{ background: '#1a1a1a' }}>
          {CAT_EMOJI[p.categoria] ?? '📦'}
        </div>
      )}
      <div className="p-3">
        <p className="text-white text-sm font-medium line-clamp-2">{p.nombre}</p>
        {p.descripcion && (
          <p className="text-gray-600 text-xs mt-1 line-clamp-1">{p.descripcion}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="font-bold text-base" style={{ color: '#00E5FF' }}>${p.precio.toFixed(2)}</p>
          <button
            onClick={() => handleAdd(p)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-bold text-base active:scale-90 transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF2D9B, #00E5FF)' }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="pb-28" style={{ background: '#0a0a0a', minHeight: '100vh' }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div className="px-5 pt-14 pb-4" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Tienda</h1>
              <p className="text-gray-500 text-sm mt-1">{productos.length} productos disponibles</p>
            </div>
            <button
              onClick={() => history.push('/carrito')}
              style={{ position: 'relative', background: '#111', border: '1px solid #222',
                borderRadius: 12, width: 42, height: 42, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, marginTop: 4, flexShrink: 0 }}
            >
              🛒
              {totalItems > 0 && (
                <div style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)',
                  color: '#000', fontSize: 10, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{totalItems > 9 ? '9+' : totalItems}</div>
              )}
            </button>
          </div>

          {/* ── Buscador ─────────────────────────────────────────── */}
          <div className="px-5 mb-4">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
              style={{ background: '#141414', border: '1px solid #2a2a2a' }}>
              <span className="text-gray-500 flex-shrink-0">🔍</span>
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar productos…"
                className="flex-1 bg-transparent text-white text-sm outline-none"
                style={{ border: 'none' }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="text-gray-500 text-lg">×</button>
              )}
            </div>
          </div>

          {/* ── Filtros ──────────────────────────────────────────── */}
          <div className="mb-5">
            <div className="flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
              {CATEGORIAS.map(cat => {
                const active = categoria === cat;
                return (
                  <button key={cat} onClick={() => setCategoria(cat)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: active ? 'linear-gradient(135deg, #FF2D9B, #00E5FF)' : '#141414',
                      color:      active ? '#000' : '#666',
                      border:     `1px solid ${active ? 'transparent' : '#1e1e1e'}`,
                      boxShadow:  active ? '0 0 16px rgba(0,229,255,0.25)' : 'none',
                    }}>
                    <span>{CAT_EMOJI[cat]}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Recomendados IA (solo usuarios logueados) ─────────── */}
          {session && recomendados.length > 0 && categoria === 'Todos' && !busqueda && (
            <div className="mb-6">
              <div className="px-5 mb-3 flex items-center gap-2">
                <h2 className="text-white font-semibold text-base">✨ Recomendado para ti</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.2)' }}>
                  IA
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto px-5 pb-2 no-scrollbar">
                {recomendados.map(p => (
                  <div key={p.id} className="flex-shrink-0 w-40">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Grid productos ────────────────────────────────────── */}
          <div className="px-5">
            <h2 className="text-white font-semibold text-base mb-3">
              {busqueda ? `Resultados: "${busqueda}"` : categoria !== 'Todos' ? categoria : 'Todos los productos'}
            </h2>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 pet-spin"
                  style={{ borderColor: '#00E5FF', borderTopColor: 'transparent' }} />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3">
                <span className="text-5xl">🔍</span>
                <p className="text-gray-400 text-sm">No se encontraron productos</p>
                <button onClick={() => { setCategoria('Todos'); setBusqueda(''); }}
                  className="text-xs font-medium" style={{ color: '#00E5FF' }}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtrados.map(p => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>

        {/* ── Toast ────────────────────────────────────────────── */}
        {toast && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-black text-sm font-medium z-50 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#FF2D9B,#00E5FF)', boxShadow: '0 0 30px rgba(0,229,255,0.4)' }}>
            {toast}
          </div>
        )}
      </IonContent>

      {/* ── Modal invitado ────────────────────────────────────── */}
      {showGuestModal && pendingProduct && (
        <div
          onClick={() => setShowGuestModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', background: '#111',
              borderRadius: '20px 20px 0 0',
              padding: '20px 20px 44px',
              border: '1px solid #222',
            }}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#333', margin: '0 auto 20px' }} />

            {/* Producto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg,#FF2D9B22,#00E5FF22)',
                border: '1px solid #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {CAT_EMOJI[pendingProduct.categoria] ?? '📦'}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>
                  {pendingProduct.nombre}
                </p>
                <p style={{ color: '#00E5FF', fontWeight: 700, fontSize: 14, margin: '2px 0 0' }}>
                  ${pendingProduct.precio.toFixed(2)}
                </p>
              </div>
            </div>

            <p style={{ color: '#aaa', fontSize: 14, margin: '0 0 20px', textAlign: 'center' }}>
              Inicia sesión para guardar tu historial de compras y acceder a recomendaciones personalizadas
            </p>

            <button
              onClick={handleGuestLogin}
              className="btn-brand"
              style={{ width: '100%', padding: '15px 0', borderRadius: 14, fontSize: 15, marginBottom: 10 }}
            >
              Iniciar sesión
            </button>

            <button
              onClick={handleGuestAdd}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 14, fontSize: 15,
                background: 'transparent', border: '1px solid #333', color: '#aaa',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Continuar como invitado
            </button>

            <p style={{ color: '#444', fontSize: 11, textAlign: 'center', margin: '12px 0 0' }}>
              El carrito de invitado no se guarda entre sesiones
            </p>
          </div>
        </div>
      )}
    </IonPage>
  );
};

export default Store;
