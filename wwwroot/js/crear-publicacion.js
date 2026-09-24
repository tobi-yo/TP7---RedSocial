let imagenSeleccionadaValida = false;

function seleccionarImagen() {
    const input = document.getElementById('imagen');
    if (input) {
        input.click();
    }
}

function limpiarVistaPrevia() {
    const preview = document.getElementById('imagenPreview');
    const placeholder = document.getElementById('previewPlaceholder');
    const mensaje = document.getElementById('imagenMensaje');

    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    if (mensaje) {
        mensaje.textContent = 'Elegí un archivo para ver la vista previa.';
    }
    imagenSeleccionadaValida = false;
}

function mostrarVistaPrevia(file) {
    const preview = document.getElementById('imagenPreview');
    const placeholder = document.getElementById('previewPlaceholder');
    const mensaje = document.getElementById('imagenMensaje');

    if (!file || !file.type || !file.type.startsWith('image/')) {
        limpiarVistaPrevia();
        if (mensaje) {
            mensaje.textContent = 'Seleccioná una imagen válida.';
        }
        return;
    }

    const url = URL.createObjectURL(file);
    const imagen = new Image();

    imagen.onload = function () {
        const ratio = imagen.width / imagen.height;
        const minRatio = 3 / 4;
        const maxRatio = 4 / 3;

        if (ratio < minRatio || ratio > maxRatio) {
            limpiarVistaPrevia();
            if (mensaje) {
                mensaje.textContent = 'La imagen debe tener una relación de aspecto entre 3/4 y 4/3.';
            }
            const input = document.getElementById('imagen');
            if (input) input.value = '';
            URL.revokeObjectURL(url);
            return;
        }

        if (preview) {
            preview.src = url;
            preview.style.display = 'block';
        }
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        if (mensaje) {
            mensaje.textContent = `Imagen lista (${imagen.width} × ${imagen.height}).`;
        }
        imagenSeleccionadaValida = true;
    };

    imagen.onerror = function () {
        limpiarVistaPrevia();
        if (mensaje) {
            mensaje.textContent = 'No se pudo leer la imagen seleccionada.';
        }
        const input = document.getElementById('imagen');
        if (input) input.value = '';
        URL.revokeObjectURL(url);
    };

    imagen.src = url;
}

function validarCrearPublicacion() {
    const titulo = document.getElementById('titulo');
    const descripcion = document.getElementById('descripcion');
    const imagen = document.getElementById('imagen');
    const mensaje = document.getElementById('mensaje');

    if (!titulo || !descripcion || !imagen) {
        return false;
    }

    if (!titulo.value.trim() || !descripcion.value.trim() || !imagen.files || imagen.files.length === 0) {
        if (mensaje) {
            mensaje.textContent = 'Completá el título, la descripción y seleccioná una imagen.';
        }
        return false;
    }

    if (!imagenSeleccionadaValida) {
        if (mensaje) {
            mensaje.textContent = 'La imagen seleccionada no cumple con la relación de aspecto requerida.';
        }
        return false;
    }

    if (mensaje) {
        mensaje.textContent = '';
    }

    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    const inputImagen = document.getElementById('imagen');
    if (inputImagen) {
        inputImagen.addEventListener('change', function (event) {
            const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
            if (file) {
                mostrarVistaPrevia(file);
            } else {
                limpiarVistaPrevia();
            }
        });
    }
});
