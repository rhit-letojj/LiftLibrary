/* Login and Register */

if (document.getElementById("f")) {
    const form = document.getElementById("f");
    const user = document.getElementById("user");
    const pass = document.getElementById("pass");
    const conf = document.getElementById("conf");
    const confWrap = document.getElementById("confWrap");
    const showpw = document.getElementById("showpw");
    const go = document.getElementById("go");
    const msg = document.getElementById("msg");
    const foot = document.getElementById("foot");
    const title = document.getElementById("formTitle");

    let registering = false;

    function updateMode() {
        if (registering) {
            title.textContent = "Register";
            go.textContent = "Register";
            confWrap.hidden = false;

            foot.innerHTML =
                'Already have an account? <button type="button" id="switch">Log in</button>';
        } else {
            title.textContent = "Log in";
            go.textContent = "Log in";
            confWrap.hidden = true;

            foot.innerHTML =
                'New here? <button type="button" id="switch">Register</button>';
        }

        document.getElementById("switch").onclick = function () {
            registering = !registering;
            msg.textContent = "";
            clearErrors();
            updateMode();
        };
    }

    function clearErrors() {
        document.getElementById("eUser").textContent = "";
        document.getElementById("ePass").textContent = "";
        document.getElementById("eConf").textContent = "";
    }

    showpw.onchange = function () {
        if (showpw.checked) {
            pass.type = "text";
            conf.type = "text";
        } else {
            pass.type = "password";
            conf.type = "password";
        }
    };

    form.onsubmit = async function (event) {
        event.preventDefault();

        clearErrors();
        msg.textContent = "";

        const username = user.value.trim();
        const password = pass.value;

        let valid = true;

        if (username === "") {
            document.getElementById("eUser").textContent =
                "Enter your username.";
            valid = false;
        }

        if (password === "") {
            document.getElementById("ePass").textContent =
                "Enter your password.";
            valid = false;
        }

        if (registering && conf.value !== password) {
            document.getElementById("eConf").textContent =
                "Passwords do not match.";
            valid = false;
        }

        if (!valid) {
            return;
        }

        go.disabled = true;

        try {
            const response = await fetch(
                `/api/${registering ? "register" : "login"}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                }
            );
            const result = await response.json();

            if (!response.ok) {
                if (registering && response.status === 409) {
                    document.getElementById("eUser").textContent = result.error;
                } else if (!registering && response.status === 401) {
                    document.getElementById("ePass").textContent = result.error;
                } else {
                    msg.textContent = result.error || "Request failed.";
                }
                return;
            }

            if (registering) {
                registering = false;
                pass.value = "";
                conf.value = "";
                updateMode();
                msg.textContent = "Account created! You can now log in.";
            } else {
                sessionStorage.setItem("liftLibraryUser", username);
                window.location.href = "home.html";
            }
        } catch {
            msg.textContent = "Could not connect to the account server.";
        } finally {
            go.disabled = false;
        }
    };

    updateMode();
}