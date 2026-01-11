import { useState, useEffect } from 'react';
import './index.css';

// --- KLEINE KOMPONENTEN (UI) ---

const OptionCard = ({ icon, title, subtitle, selected, onClick, special }) => (
  <div 
    onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 transition-all flex items-center gap-3 relative
      ${selected ? 'selected' : 'bg-white border-slate-200'}
      ${special ? 'bg-blue-50 border-blue-200' : ''}
    `}
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition-colors
      ${selected ? '' : (special ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}
    `}>
      <i className={`ph ${icon}`}></i>
    </div>
    <div>
      <div className="font-semibold text-slate-800 text-sm md:text-base">{title}</div>
      {subtitle && <div className={`text-xs mt-0.5 ${special ? 'text-blue-600 font-bold uppercase' : 'text-slate-500'}`}>{subtitle}</div>}
    </div>
  </div>
);

const StepHeader = ({ current, total }) => (
  <div className="bg-white px-6 pt-6 pb-2 sticky top-0 z-10 border-b border-slate-100 mb-4">
    <div className="flex justify-between items-centeryb mb-4">
      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">Anfrage</span>
      <span className="text-xs font-medium text-slate-400">Schritt {current}/{total}</span>
    </div>
    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
      <div className="bg-blue-600 h-full transition-all duration-500 ease-out rounded-full" style={{ width: `${(current/total)*100}%` }}></div>
    </div>
  </div>
);

// --- MAIN APP ---

function App() {
  const [uuid, setUuid] = useState(null);
  const [loading,FLoading] = useState(true); // Initial Load Check
  const [submitting, setSubmitting] = useState(false); // Beim Absenden
  const [status, setStatus] = useState('checking'); // checking, open, submitted, error
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    einkommen: '', finanzierung: '', schufa: '', grund: ''
  });

  // 1. UUID holen und prüfen
  useEffect(() => {
    // UUID aus URL holen (Query param ?uuid=... oder letzter Pfadteil)
    const params = new URLSearchParams(window.location.search);
    let foundUuid = params.get('uuid');
    if (!foundUuid) {
      const parts = window.location.pathname.split('/').filter(p => p.length > 0);
      if (parts.length > 0) foundUuid = parts[parts.length - 1];
    }

    setUuid(foundUuid);

    if (foundUuid) {
      // API Check
      fetch(`/api/check/${foundUuid}`)
        .then(res => res.json())
        .then(data => {
          if (data.exists) setStatus('submitted');
          else setStatus('open');
          FLoading(false);
        })
        .catch(() => {
          setStatus('error');
          FLoading(false);
        });
    } else {
      setStatus('error'); // Keine UUID
      FLoading(false);
    }
  }, []);

  // Handler
  const updateData = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setTimeout(() => setStep(prev => prev + 1), 250); // Auto-Advance
  };

  const submitForm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid, ...formData })
      });
      if (res.ok) setStatus('submitted_now');
      else setStatus('error');
    } catch (e) {
      setStatus('error');
    }
    setSubmitting(false);
  };

  // --- RENDERING ---

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="loader rounded-full border-4 border-t-4 border-slate-200 h-10 w-10"></div></div>;

  if (status === 'error' && !uuid) return <ErrorScreen msg="Keine UUID gefunden. Bitte nutzen Sie den Link aus der E-Mail." />;
  if (status === 'error') return <ErrorScreen msg="Ein Fehler ist aufgetreten oder der Server ist nicht erreichbar." />;
  
  // Bereits abgesendet Screen (Bevor man das Formular sieht!)
  if (status === 'submitted') return <AlreadySubmittedScreen />;
  
  // Erfolgreich gerade eben abgesendet
  if (status === 'submitted_now') return <SuccessScreen />;

  return (
    <div className="flex items-center justify-center min-h-screen p-0 sm:p-4 bg-slate-50">
      <div className="bg-white w-full max-w-[500px] sm:rounded-2xl shadow-lg overflow-hidden min-h-screen sm:min-h-[600px] flex flex-col border-slate-200 sm:border">
        
        <StepHeader current={step} total={4} />

        <div className="flex-grow px-6 py-4">
          
          {/* SCHRITT 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Nettoeinkommen</h1>
              <p className="text-sm text-slate-500 mb-6">Monatliches Haushaltsnettoeinkommen?</p>
              <div className="flex flex-col gap-3">
                {['Unter 2.500 €', '2.500 € – 4.000 €', '4.000 € – 6.000 €', 'Über 6.000 €'].map((opt, i) => (
                  <OptionCard key={i} title={opt} icon={['trend-down', 'coins', 'chart-bar', 'crown'][i]} 
                    selected={formData.einkommen === opt} onClick={() => updateData('einkommen', opt)} />
                ))}
              </div>
            </div>
          )}

          {/* SCHRITT 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Finanzierung</h1>
              <p className="text-sm text-slate-500 mb-6">Liegt bereits eine Bestätigung vor?</p>
              <div className="flex flex-col gap-3">
                <OptionCard title="Ja, liegt bereits vor" subtitle="Bevorzugte Behandlung" icon="check-circle" special={true}
                   onClick={() => updateData('finanzierung', 'Ja, liegt vor')} />
                <OptionCard title="Im Gespräch mit Bank" icon="chats-circle" onClick={() => updateData('finanzierung', 'Im Gespräch')} />
                <OptionCard title="Noch nicht gekümmert" icon="hourglass" onClick={() => updateData('finanzierung', 'Noch nicht')} />
                <OptionCard title="Barzahler / Eigenkapital" icon="briefcase" onClick={() => updateData('finanzierung', 'Barzahler')} />
              </div>
            </div>
          )}

           {/* SCHRITT 3 */}
           {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Bonität / Schufa</h1>
              <p className="text-sm text-slate-500 mb-6">Gibt es negative Einträge?</p>
              <div className="flex flex-col gap-3">
                <OptionCard title="Nein, alles sauber" subtitle="Keine negativen Einträge" icon="thumbs-up"
                   onClick={() => updateData('schufa', 'Sauber')} />
                <OptionCard title="Ja, Einträge vorhanden" subtitle="Offene Forderungen etc." icon="warning-circle"
                   onClick={() => updateData('schufa', 'Einträge')} />
                <OptionCard title="Weiß ich nicht genau" icon="question"
                   onClick={() => updateData('schufa', 'Unbekannt')} />
              </div>
            </div>
          )}

          {/* SCHRITT 4 */}
          {step === 4 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-slate-900 mb-1">Details & Grund</h1>
              <p className="text-sm text-slate-500 mb-6">Erzählen Sie uns kurz von Ihrer Situation.</p>
              
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <textarea 
                  className="w-full h-32 outline-none text-slate-800 resize-none bg-transparent text-sm leading-relaxed"
                  placeholder="Beispiel: Wir suchen ab dem 01.08. eine Wohnung..."
                  value={formData.grund}
                  onChange={(e) => setFormData({...formData, grund: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-between mt-2 px-1">
                 <span className={`text-xs font-medium ${formData.grund.length >= 3 ? 'text-green-500' : 'text-slate-300'}`}>
                    {formData.grund.length >= 3 ? 'Bereit zum Senden' : 'Min. 3 Zeichen'}
                 </span>
                 <span className="text-xs text-slate-400">{formData.grund.length}/500</span>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-white px-6 pb-6 pt-2 flex justify-between items-center mt-auto">
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)} className="text-slate-500 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              <i className="ph ph-arrow-left"></i> Zurück
            </button>
          )}
          
          {step === 4 && (
            <button 
              onClick={submitForm} 
              disabled={submitting || formData.grund.length < 3}
              className="ml-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
            >
              {submitting ? 'Sende...' : 'Absenden'} <i className="ph ph-paper-plane-right"></i>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// --- SCREENS ---

const AlreadySubmittedScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-white p-4 text-center">
    <div className="max-w-md">
      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        <i className="ph ph-info"></i>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Bereits empfangen</h2>
      <p className="text-slate-500">Wir haben Ihre Angaben zu dieser Anfrage bereits erhalten.</p>
    </div>
  </div>
);

const SuccessScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-white p-4 text-center">
    <div className="max-w-md animate-fade-in-up">
      <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
        <i className="ph ph-check"></i>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-3">Vielen Dank!</h2>
      <p className="text-slate-500">Ihre Daten wurden erfolgreich übermittelt. Wir melden uns in Kürze bei Ihnen.</p>
    </div>
  </div>
);

const ErrorScreen = ({ msg }) => (
  <div className="flex items-center justify-center min-h-screen bg-white p-4 text-center">
    <div className="max-w-md">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
        <i className="ph ph-warning-circle"></i>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Ups!</h2>
      <p className="text-slate-500">{msg}</p>
    </div>
  </div>
);

export default App;