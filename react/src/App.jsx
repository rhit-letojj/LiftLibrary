import React from 'react';
import './App.css';

function App() {
    return (
        <>
            <header>
                <h1>Lift Library</h1>
            </header>
            <main className="builder">
                <div className="content">
                    <section className="card">
                        <h2>Barbell Builder</h2>
                        <div className="view" id="view"></div>
                        <div className="total" id="total"></div>
                        <div className="msg" id="msg" role="status"></div>
                        <div className="row">
                            <div className="toggle">
                                <button type="button" className="chip active">lb</button>
                                <button type="button" className="chip">kg</button>
                            </div>
                            <button type="button">Remove outer plates</button>
                            <button type="button">Clear all</button>
                        </div>
                        <div className="row">
                            <label>
                                Lift name
                                <input
                                    id="name"
                                    list="lifts"
                                    placeholder="e.g. Back squat"
                                    maxLength="40"
                                />
                                <datalist id="lifts">
                                    <option value="Back squat" />
                                    <option value="Front squat" />
                                    <option value="Bench press" />
                                    <option value="Deadlift" />
                                    <option value="Overhead press" />
                                    <option value="Power clean" />
                                </datalist>
                            </label>

                            <label>
                                Date
                                <input id="date" type="date" />
                            </label>

                            <button type="button" className="primary">Log lift</button>
                            <button type="button" hidden>Cancel edit</button>
                        </div>
                    </section>
                    <div className="panels">
                        <section className="card">
                            <h2>Plates</h2>
                            <div className="opts" id="plates"></div>
                        </section>
                    </div>
                </div>

                <aside className="card side">
                    <h2>Library</h2>
                </aside>
            </main>
        </>
    );
}

export default App;


//i want to be able to transfer the contents of the html and css and javacript stuff in the current server and public files from the parent directory, to the actual .jsx and .css files in the react app. im not too sure as to where stuff goes or anything like that
