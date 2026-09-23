var mensaje = document.getElementById("mensaje");
if (mensaje) { mensaje.innerHTML = ""; mensaje.style.display = "none"; }

function _showMensaje(text) {
    var el = document.getElementById("mensaje");
    if (!el) return;
    el.innerHTML = text;
    el.style.display = "block";
}

function _hideMensaje() {
    var el = document.getElementById("mensaje");
    if (!el) return;
    el.innerHTML = "";
    el.style.display = "none";
}

function isTurnstileAvailable() {
    return !!document.querySelector('textarea[name="cf-turnstile-response"], input[name="cf-turnstile-response"]');
}

function getTurnstileResponse() {
    var el = document.querySelector('textarea[name="cf-turnstile-response"], input[name="cf-turnstile-response"]');
    return el ? (el.value || '').trim() : '';
}

function validarCuenta() {
    var usuario = document.getElementById("usuario") ? document.getElementById("usuario").value : "";
    var contrasena = document.getElementById("contrasena") ? document.getElementById("contrasena").value : "";
    if (usuario === "" || contrasena === "") {
        _showMensaje("Por favor, complete todos los campos.");
        return false;
    }

    var token = getTurnstileResponse();
    if (!token) {
        _showMensaje("Por favor, complete el captcha.");
        return false;
    }

    _hideMensaje();
    return true;
}

function validarRegistro() {
    var nombreUsuario = document.getElementById("nombreUsuario") ? document.getElementById("nombreUsuario").value : "";
    var contrasena = document.getElementById("contrasena") ? document.getElementById("contrasena").value : "";
    var nombre = document.getElementById("nombre") ? document.getElementById("nombre").value : "";
    var apellido = document.getElementById("apellido") ? document.getElementById("apellido").value : "";
    var tipoUsuario = document.querySelector('input[name="TipoUsuario"]:checked');
    var soloLetrasYNumeros = /^[a-zA-Z0-9]+$/;
    var soloLetrasYEspacios = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (nombreUsuario === "" || contrasena === "" || nombre === "" || apellido === "" || !tipoUsuario) {
        _showMensaje("Por favor, complete todos los campos.");
        return false;
    }
    if (contrasena.length < 8) {
        _showMensaje("La contraseña debe tener al menos 8 caracteres.");
        return false;
    }
    if (nombreUsuario.length < 3) {
        _showMensaje("El nombre de usuario debe tener al menos 3 caracteres.");
        return false;
    }
    if (!soloLetrasYNumeros.test(nombreUsuario)) {
        _showMensaje("El nombre de usuario solo puede contener letras y números, sin espacios ni caracteres especiales.");
        return false;
    }
    if (!soloLetrasYEspacios.test(nombre)) {
        _showMensaje("El nombre solo puede contener letras y espacios, sin caracteres especiales.");
        return false;
    }
    if (!soloLetrasYEspacios.test(apellido)) {
        _showMensaje("El apellido solo puede contener letras y espacios, sin caracteres especiales.");
        return false;
    }

    var token = getTurnstileResponse();
    if (!token) {
        _showMensaje("Por favor, complete el captcha.");
        return false;
    }

    _hideMensaje();
    return true;
}

