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

    form.onsubmit = function (event) {
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

        const users = JSON.parse(
            localStorage.getItem("liftLibraryUsers") || "{}"
        );

        if (registering) {
            if (users[username]) {
                document.getElementById("eUser").textContent =
                    "Username already exists.";
                return;
            }

            users[username] = password;

            localStorage.setItem(
                "liftLibraryUsers",
                JSON.stringify(users)
            );

            registering = false;

            pass.value = "";
            conf.value = "";

            updateMode();

            msg.textContent =
                "Account created! You can now log in.";
        } else {
            if (!users[username] || users[username] !== password) {
                document.getElementById("ePass").textContent =
                    "Incorrect username or password.";
                return;
            }

            window.location.href = "home.html";
        }
    };

    updateMode();
}