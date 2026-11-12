import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import './App.css';

const plateImages = import.meta.glob('./assets/plates/*.svg', {
  eager: true,
  import: 'default',
  query: '?url',
});

function plateImagePath(unit, weight) {
  return plateImages[`./assets/plates/${unit}-${String(weight).replace('.', '-')}.svg`];
}

const plateThicknessMm = {
  lb: { 45: 40.8, 35: 40.2, 25: 43, 10: 36.2, 5: 27.2, 2.5: 21.8 },
  kg: { 25: 27, 20: 20, 15: 19, 10: 19, 5: 20, 2.5: 15, 1.25: 12 },
};

const plateDiameterMm = {
  lb: { 45: 450, 35: 400, 25: 325, 10: 228, 5: 190, 2.5: 160 },
  kg: { 25: 450, 20: 450, 15: 400, 10: 325, 5: 228, 2.5: 190, 1.25: 160 },
};

const sleeveLengthMm = 445;
const sleeveStopWidthMm = 12;
const collarWidthMm = 26.4;
const collarDiameterMm = 60;

const plateFaceColors = {
  lb: { 45: '#b8bec3', 35: '#aeb4b9', 25: '#c4c9cd', 10: '#a8afb4', 5: '#c6cacf', 2.5: '#aeb4b9' },
  kg: { 25: '#d71920', 20: '#005baa', 15: '#f3c300', 10: '#00843d', 5: '#f5f5f5', 2.5: '#d71920', 1.25: '#00843d' },
};

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

function Header({ username, onLogout }) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <a className="brand" href="/">Lift Library</a>
      <nav aria-label="Main navigation">
        <a href="/">Barbell builder</a>
        {username ? (
          <>
            <span className="nav-user">{username}</span>
            <button type="button" className="link-button" onClick={onLogout}>Log out</button>
          </>
        ) : (
          <a href="/login">Log in / Register</a>
        )}
      </nav>
    </header>
  );
}

function LoginPage({ onLogin }) {
  const [registering, setRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    const cleanUsername = username.trim();
    if (!cleanUsername) nextErrors.username = 'Enter your username.';
    if (!password) nextErrors.password = 'Enter your password.';
    if (registering && password !== confirmation) {
      nextErrors.confirmation = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    setMessage('');
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      if (registering) {
        await api.register(cleanUsername, password);
        setRegistering(false);
        setPassword('');
        setConfirmation('');
        setMessage('Account created. You can now log in.');
      } else {
        const result = await api.login(cleanUsername, password);
        onLogin(result.username);
        window.location.assign('/');
      }
    } catch (error) {
      if (registering && error.status === 409) {
        setErrors({ username: error.message });
      } else if (!registering && error.status === 401) {
        setErrors({ password: error.message });
      } else {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setRegistering((value) => !value);
    setErrors({});
    setMessage('');
  }

  useEffect(() => {
    const firstInvalidField = ['username', 'password', 'confirmation']
      .find((field) => errors[field]);
    if (firstInvalidField) {
      document.getElementById(`login-${firstInvalidField}`)?.focus();
    }
  }, [errors]);

  return (
    <main className="login-page" id="main-content" tabIndex="-1">
      <section className="card login-card">
        <h1>{registering ? 'Register' : 'Log in'}</h1>
        <form onSubmit={submit} noValidate>
          <label>
            Username
            <input
              aria-describedby={errors.username ? 'username-error' : undefined}
              aria-invalid={Boolean(errors.username)}
              autoComplete="username"
              id="login-username"
              maxLength={20}
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            {errors.username && <span className="field-error" id="username-error">{errors.username}</span>}
          </label>
          <label>
            Password
            <input
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete={registering ? 'new-password' : 'current-password'}
              id="login-password"
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            {errors.password && <span className="field-error" id="password-error">{errors.password}</span>}
          </label>
          {registering && (
            <label>
              Confirm password
              <input
                aria-describedby={errors.confirmation ? 'confirmation-error' : undefined}
                aria-invalid={Boolean(errors.confirmation)}
                autoComplete="new-password"
                id="login-confirmation"
                onChange={(event) => setConfirmation(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
              />
              {errors.confirmation && (
                <span className="field-error" id="confirmation-error">{errors.confirmation}</span>
              )}
            </label>
          )}
          <label className="checkbox-label">
            <input
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              type="checkbox"
            />
            Show password
          </label>
          <button className="primary full-width" disabled={busy} type="submit">
            {busy ? 'Please wait…' : registering ? 'Register' : 'Log in'}
          </button>
          <p aria-live="polite" className={errors.username || errors.password ? 'message error' : 'message'}>
            {message}
          </p>
        </form>
        <p className="form-switch">
          {registering ? 'Already have an account?' : 'New here?'}{' '}
          <button className="link-button" onClick={switchMode} type="button">
            {registering ? 'Log in' : 'Register'}
          </button>
        </p>
      </section>
    </main>
  );
}

function PlateStack({ plates, side, unit }) {
  return (
    <div aria-label={`${side} ${unit} plates`} className={`plate-stack ${side} ${unit}`}>
      {plates.map((weight, index) => {
        const diameterMm = plateDiameterMm[unit]?.[weight] ?? 450;
        return (
          <span
            aria-label={`${weight} ${unit} plate`}
            className={`plate plate-${String(weight).replace('.', '-')}`}
            key={`${side}-${index}-${weight}`}
            style={{
              aspectRatio: `${plateThicknessMm[unit][weight]} / ${diameterMm}`,
              height: `${(diameterMm / 450) * 100}%`,
            }}
            title={`${weight}`}
          >
            <img alt="" aria-hidden="true" draggable="false" src={plateImagePath(unit, weight)} />
          </span>
        );
      })}
    </div>
  );
}

function PlateFace({ unit, weight }) {
  const color = plateFaceColors[unit][weight];
  const isSteel = unit === 'lb';
  return (
    <svg aria-hidden="true" className={`plate-face${isSteel ? ' steel' : ''}`} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="47" fill={color} stroke={isSteel ? '#555b60' : '#171719'} strokeWidth="3" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={isSteel ? '#eef0f2' : '#fff'} strokeOpacity=".62" strokeWidth="3" />
      <circle cx="50" cy="50" r="12" fill="#171719" stroke={isSteel ? '#555b60' : '#fff'} strokeWidth="3" />
      {isSteel && <circle cx="50" cy="50" r="42" fill="none" stroke="#fff" strokeOpacity=".26" strokeWidth="2" />}
    </svg>
  );
}

function BarbellCollar({ side }) {
  const gradientId = `collar-metal-${side}`;
  return (
    <svg
      aria-hidden="true"
      className="barbell-collar"
      preserveAspectRatio="none"
      style={{ height: `${(collarDiameterMm / 450) * 100}%` }}
      viewBox="0 0 44 100"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#555b60" />
          <stop offset=".18" stopColor="#d9dcde" />
          <stop offset=".48" stopColor="#777d82" />
          <stop offset=".76" stopColor="#e5e7e8" />
          <stop offset="1" stopColor="#50565b" />
        </linearGradient>
      </defs>
      <path d="M6 2h32l4 4v88l-4 4H6l-4-4V6Z" fill={`url(#${gradientId})`} stroke="#3f454a" strokeWidth="2" />
      <path d="M9 6v88M35 6v88" stroke="#f1f2f3" strokeOpacity=".48" strokeWidth="2" />
      <path d="m17 10 5-3 5 3v6l-5 3-5-3Z" fill="#656b70" stroke="#353b40" strokeWidth="1.5" />
      <path d="M19 11h6" stroke="#e4e6e8" strokeOpacity=".72" strokeWidth="1" />
    </svg>
  );
}

function BarbellView({ plates, bar, cuffs, unit }) {
  return (
    <div
      aria-label={`Barbell with ${plates.length} plate${plates.length === 1 ? '' : 's'} per side, in ${unit}. Drawn to scale using a 2,200 millimeter bar and weight-specific plate dimensions.`}
      className="barbell-view"
    >
      <svg aria-hidden="true" className="bar-graphic" preserveAspectRatio="none" viewBox="0 0 2200 600">
        <defs>
          <linearGradient id="sleeve-metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#d7dadd" />
            <stop offset=".16" stopColor="#858b90" />
            <stop offset=".38" stopColor="#4e5459" />
            <stop offset=".55" stopColor="#30353a" />
            <stop offset=".78" stopColor="#aeb3b7" />
            <stop offset="1" stopColor="#666c71" />
          </linearGradient>
          <linearGradient id="shaft-metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f0f1f2" />
            <stop offset=".22" stopColor="#8f959a" />
            <stop offset=".5" stopColor="#555b60" />
            <stop offset=".76" stopColor="#b7bbbe" />
            <stop offset="1" stopColor="#777d82" />
          </linearGradient>
          <pattern height="12" id="shaft-knurl" patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width="12">
            <path d="M0 0v12" stroke="#252a2e" strokeOpacity=".38" strokeWidth="1" />
            <path d="M6 0v12" stroke="#f1f2f3" strokeOpacity=".22" strokeWidth="1" />
          </pattern>
        </defs>
        <g stroke="#41474c" strokeWidth="2">
          <rect fill="url(#sleeve-metal)" height="50" rx="3" width="433" x="0" y="275" />
          <rect fill="url(#sleeve-metal)" height="50" rx="3" width="433" x="1767" y="275" />
        </g>
        <g fill="none">
          <path d="M8 278v44M2192 278v44" stroke="#e1e3e5" strokeOpacity=".58" strokeWidth="3" />
          <path d="M14 278v44M2186 278v44" stroke="#343a3f" strokeOpacity=".72" strokeWidth="2" />
          <path d="M436 273v54M1764 273v54" stroke="#e1e3e5" strokeOpacity=".62" strokeWidth="2" />
          <path d="M443 273v54M1757 273v54" stroke="#292f34" strokeOpacity=".82" strokeWidth="2" />
        </g>
        <g stroke="#41474c" strokeWidth="2">
          <rect fill="url(#sleeve-metal)" height="60" rx="2" width="12" x="433" y="270" />
          <rect fill="url(#sleeve-metal)" height="60" rx="2" width="12" x="1755" y="270" />
        </g>
        <rect fill="url(#shaft-metal)" height="28" width="1310" x="445" y="286" />
        <rect fill="url(#shaft-knurl)" height="24" opacity=".55" width="670" x="765" y="288" />
        <g stroke="#f0f1f2" strokeOpacity=".5" strokeWidth="2">
          <path d="M755 286v28M1445 286v28" />
        </g>
      </svg>
      <div className="plate-load plate-load-left">
        <PlateStack plates={plates} side="left" unit={unit} />
        {cuffs !== 'None' && <BarbellCollar side="left" />}
      </div>
      <div className="plate-load plate-load-right">
        <PlateStack plates={plates} side="right" unit={unit} />
        {cuffs !== 'None' && <BarbellCollar side="right" />}
      </div>
      <span className="bar-label">{bar}</span>
    </div>
  );
}

function Builder({ username, options }) {
  const [unit, setUnit] = useState('lb');
  const [bar, setBar] = useState(options.bars[0].name);
  const [cuffs, setCuffs] = useState('None');
  const [plates, setPlates] = useState([]);
  const [liftName, setLiftName] = useState('');
  const [liftDate, setLiftDate] = useState(today());
  const [lifts, setLifts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingLifts, setLoadingLifts] = useState(Boolean(username));

  const barOption = options.bars.find((item) => item.name === bar) || options.bars[0];
  const cuffOption = options.cuffs.find((item) => item.name === cuffs) || options.cuffs[0];
  const sleeveLoadLimit = sleeveLengthMm - sleeveStopWidthMm - (cuffs === 'None' ? 0 : collarWidthMm);
  const loadedPlateThickness = plates.reduce((sum, weight) => sum + plateThicknessMm[unit][weight], 0);
  const total = useMemo(
    () => barOption.weights[unit] + plates.reduce((sum, weight) => sum + weight * 2, 0) + cuffOption.weights[unit],
    [barOption, plates, unit, cuffOption],
  );

  useEffect(() => {
    if (!username) return;
    let active = true;
    api.getLifts()
      .then((items) => { if (active) setLifts(items); })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoadingLifts(false); });
    return () => { active = false; };
  }, [username]);

  function resetForm() {
    setPlates([]);
    setBar(options.bars[0].name);
    setCuffs('None');
    setLiftName('');
    setLiftDate(today());
    setEditingId(null);
    setMessage('');
    setError('');
  }

  function changeUnit(nextUnit) {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    setPlates([]);
    setMessage('Plate selection cleared because plate weights differ by unit.');
    setError('');
  }

  function editLift(item) {
    setUnit(item.unit);
    setBar(item.barType);
    setCuffs(item.cuffType);
    setPlates([...item.platesPerSide]);
    setLiftName(item.liftName);
    setLiftDate(item.liftDate);
    setEditingId(item.id);
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveLift(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!username) {
      setError('Log in to save lifts to your library.');
      return;
    }
    const payload = {
      liftName: liftName.trim(),
      liftDate,
      unit,
      barType: bar,
      platesPerSide: plates,
      cuffType: cuffs,
    };
    try {
      if (editingId) {
        await api.updateLift(editingId, payload);
      } else {
        await api.addLift(payload);
      }
      setLifts(await api.getLifts());
      resetForm();
      setMessage(editingId ? 'Lift updated.' : 'Lift saved to your library.');
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function deleteLift(id) {
    if (!window.confirm('Delete this lift from your library?')) return;
    setMessage('');
    setError('');
    try {
      await api.deleteLift(id);
      setLifts(await api.getLifts());
      if (editingId === id) resetForm();
      setMessage('Lift deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const sortedLifts = [...lifts].sort((a, b) => b.liftDate.localeCompare(a.liftDate));

  return (
    <main className="builder-layout" id="main-content" tabIndex="-1">
      <div className="builder-content">
        <section className="card builder-card">
          <h1>Barbell Builder</h1>
          <BarbellView bar={bar} cuffs={cuffs} plates={plates} unit={unit} />
          <p className="plate-scale-note">
            Scale: 2,200 mm bar; KG dimensions follow Eleiko IPF specs, LB dimensions are corresponding estimates.
          </p>
          <p aria-atomic="true" aria-live="polite" className="total">
            {total.toLocaleString(undefined, { maximumFractionDigits: 2 })} {unit}
          </p>
          <p aria-live="polite" className={error ? 'message error' : 'message'}>{error || message}</p>

          <div className="control-row">
            <div aria-label="Weight unit" className="unit-toggle" role="group">
              {options.units.map((value) => (
                <button
                  aria-pressed={unit === value}
                  className={unit === value ? 'chip active' : 'chip'}
                  key={value}
                  onClick={() => changeUnit(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
            <button disabled={!plates.length} onClick={() => setPlates((current) => current.slice(0, -1))} type="button">
              Remove outer plates
            </button>
            <button onClick={resetForm} type="button">Clear all</button>
          </div>

          <form className="lift-form" onSubmit={saveLift}>
            <label>
              Lift name
              <input
                list="lift-suggestions"
                maxLength={40}
                onChange={(event) => setLiftName(event.target.value)}
                placeholder="e.g. Back squat"
                required
                value={liftName}
              />
              <datalist id="lift-suggestions">
                {['Back squat', 'Front squat', 'Bench press', 'Deadlift', 'Overhead press', 'Power clean'].map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
            <label>
              Date
              <input onChange={(event) => setLiftDate(event.target.value)} required type="date" value={liftDate} />
            </label>
            <button className="primary" type="submit">{editingId ? 'Update lift' : 'Log lift'}</button>
            {editingId && <button onClick={resetForm} type="button">Cancel edit</button>}
          </form>
        </section>

        <div className="option-panels">
          <section className="card">
            <h2>Plates</h2>
            <p className="plate-capacity">
              {Math.max(0, sleeveLoadLimit - loadedPlateThickness).toFixed(1)} mm sleeve space remaining per side.
              Plates that do not fit are disabled.
            </p>
            <div className="options-grid">
              {options.plates[unit].map((weight) => {
                const fitsSleeve = loadedPlateThickness + plateThicknessMm[unit][weight] <= sleeveLoadLimit;
                return (
                <button
                  aria-label={`Add ${weight} ${unit} plates to both sides${fitsSleeve ? '' : '; does not fit on the remaining sleeve'}`}
                  className="option-button"
                  disabled={!fitsSleeve || plates.length >= 20}
                  key={weight}
                  onClick={() => setPlates((current) => [...current, weight])}
                  title={!fitsSleeve ? 'This plate will not fit on the remaining sleeve space.' : undefined}
                  type="button"
                >
                  <PlateFace unit={unit} weight={weight} />
                  {weight} {unit}
                </button>
                );
              })}
            </div>
          </section>
          <section className="card">
            <h2>Bars</h2>
            <div className="options-list">
              {options.bars.map((item) => (
                <button
                  aria-pressed={bar === item.name}
                  className={bar === item.name ? 'choice selected' : 'choice'}
                  key={item.name}
                  onClick={() => setBar(item.name)}
                  type="button"
                >
                  <span>{item.name}</span><span>{item.weights[unit]} {unit}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="card">
            <h2>Collars</h2>
            <div className="options-list">
              {options.cuffs.map((item) => {
                const exceedsSleeve = item.name !== 'None'
                  && loadedPlateThickness + collarWidthMm > sleeveLengthMm;
                return (
                <button
                  aria-label={`${item.name}, ${item.weights[unit]} ${unit}${exceedsSleeve ? '; does not fit with current plates' : ''}`}
                  aria-pressed={cuffs === item.name}
                  className={cuffs === item.name ? 'choice selected' : 'choice'}
                  disabled={exceedsSleeve}
                  key={item.name}
                  onClick={() => setCuffs(item.name)}
                  title={exceedsSleeve ? 'Remove a plate to make room for the collar.' : undefined}
                  type="button"
                >
                  <span>{item.name}</span><span>+{item.weights[unit]} {unit}</span>
                </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <aside aria-labelledby="library-heading" className="card library">
        <div className="library-heading">
          <h2 id="library-heading">Library</h2>
          {username && <span className="library-user">{username}</span>}
        </div>
        {!username ? (
          <p className="muted">Log in to save and manage your lifts.</p>
        ) : loadingLifts ? (
          <p className="muted">Loading your lifts…</p>
        ) : sortedLifts.length === 0 ? (
          <p className="muted">Your saved lifts will appear here.</p>
        ) : (
          <ul className="lift-list">
            {sortedLifts.map((item) => (
              <li className="lift-item" key={item.id}>
                <div>
                  <strong>{item.liftName}</strong>
                  <span>{item.liftDate} · {item.totalWeight} {item.unit}</span>
                  <span>{item.barType}{item.cuffType !== 'None' ? ` · ${item.cuffType}` : ''}</span>
                </div>
                <div className="lift-actions">
                  <button aria-label={`Edit ${item.liftName}`} onClick={() => editLift(item)} type="button">Edit</button>
                  <button aria-label={`Delete ${item.liftName}`} onClick={() => deleteLift(item.id)} type="button">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </main>
  );
}

function App() {
  const [username, setUsername] = useState(null);
  const [options, setOptions] = useState(null);
  const [startupError, setStartupError] = useState('');
  const isLoginPage = window.location.pathname.replace(/\/+$/, '') === '/login';

  useEffect(() => {
    let active = true;
    Promise.all([api.getSession(), api.getOptions()])
      .then(([session, appOptions]) => {
        if (!active) return;
        setUsername(session.username);
        setOptions(appOptions);
      })
      .catch((error) => { if (active) setStartupError(error.message); });
    return () => { active = false; };
  }, []);

  async function logout() {
    try {
      await api.logout();
      setUsername(null);
      window.location.assign('/');
    } catch (error) {
      setStartupError(error.message);
    }
  }

  return (
    <>
      <Header onLogout={logout} username={username} />
      {startupError ? (
        <main className="startup-error" id="main-content" role="alert" tabIndex="-1">{startupError}</main>
      ) : !options ? (
        <main className="startup-error" id="main-content" tabIndex="-1">Loading Lift Library…</main>
      ) : isLoginPage ? (
        <LoginPage onLogin={setUsername} />
      ) : (
        <Builder key={username || 'guest'} options={options} username={username} />
      )}
    </>
  );
}

export default App;
