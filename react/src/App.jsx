import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import './App.css';

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

function Header({ username, onLogout }) {
  return (
    <header className="site-header">
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

  return (
    <main className="login-page">
      <section className="card login-card">
        <h1>{registering ? 'Register' : 'Log in'}</h1>
        <form onSubmit={submit} noValidate>
          <label>
            Username
            <input
              autoComplete="username"
              maxLength={20}
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </label>
          <label>
            Password
            <input
              autoComplete={registering ? 'new-password' : 'current-password'}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </label>
          {registering && (
            <label>
              Confirm password
              <input
                autoComplete="new-password"
                onChange={(event) => setConfirmation(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                value={confirmation}
              />
              {errors.confirmation && <span className="field-error">{errors.confirmation}</span>}
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

function PlateStack({ plates, side }) {
  return (
    <div aria-label={`${side} plates`} className={`plate-stack ${side}`}>
      {plates.map((weight, index) => (
        <span
          aria-label={`${weight} plate`}
          className={`plate plate-${String(weight).replace('.', '-')}`}
          key={`${side}-${index}-${weight}`}
          title={`${weight}`}
        />
      ))}
    </div>
  );
}

function BarbellView({ plates, bar, cuffs }) {
  return (
    <div aria-label={`Barbell with ${plates.length} plates per side`} className="barbell-view">
      <PlateStack plates={plates} side="left" />
      <span className="bar-sleeve" />
      <span className="bar-shaft" />
      <span className="bar-sleeve" />
      <PlateStack plates={plates} side="right" />
      {cuffs !== 'None' && <span className="collar collar-left" />}
      {cuffs !== 'None' && <span className="collar collar-right" />}
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
    <main className="builder-layout">
      <div className="builder-content">
        <section className="card builder-card">
          <h1>Barbell Builder</h1>
          <BarbellView bar={bar} cuffs={cuffs} plates={plates} />
          <p className="total">
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
            <div className="options-grid">
              {options.plates[unit].map((weight) => (
                <button
                  aria-label={`Add ${weight} ${unit} plates to both sides`}
                  className="option-button"
                  disabled={plates.length >= 20}
                  key={weight}
                  onClick={() => setPlates((current) => [...current, weight])}
                  title={plates.length >= 20 ? 'Maximum 20 plates per side' : undefined}
                  type="button"
                >
                  <span className={`plate-swatch plate-${String(weight).replace('.', '-')}`} />
                  {weight} {unit}
                </button>
              ))}
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
              {options.cuffs.map((item) => (
                <button
                  aria-pressed={cuffs === item.name}
                  className={cuffs === item.name ? 'choice selected' : 'choice'}
                  key={item.name}
                  onClick={() => setCuffs(item.name)}
                  type="button"
                >
                  <span>{item.name}</span><span>+{item.weights[unit]} {unit}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <aside className="card library">
        <div className="library-heading">
          <h2>Library</h2>
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
        <main className="startup-error" role="alert">{startupError}</main>
      ) : !options ? (
        <main className="startup-error">Loading Lift Library…</main>
      ) : isLoginPage ? (
        <LoginPage onLogin={setUsername} />
      ) : (
        <Builder key={username || 'guest'} options={options} username={username} />
      )}
    </>
  );
}

export default App;
