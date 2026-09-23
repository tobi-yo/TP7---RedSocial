// Variables globales
let desde = 0;
const cantidadPorPagina = 4;

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Cargar publicaciones iniciales
function cargarPublicacionesIniciales() {
    fetch(`/Home/ObtenerPublicaciones?desde=0&cantidad=${cantidadPorPagina}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('publicacionesContainer');
        container.innerHTML = '';
        
        data.forEach(pub => {
            container.appendChild(crearElementoPublicacion(pub));
        });

        desde = cantidadPorPagina;
        mostrarBtnVerMas();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Cargar más publicaciones
function cargarMasPublicaciones() {
    const btnVerMas = document.getElementById('btnVerMas');
    btnVerMas.disabled = true;
    btnVerMas.innerHTML = '<div class="spinner"></div> Cargando...';

    fetch(`/Home/ObtenerPublicaciones?desde=${desde}&cantidad=${cantidadPorPagina}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('publicacionesContainer');
        
        if (data.length === 0) {
            // No hay más publicaciones
            document.getElementById('verMasContainer').style.display = 'none';
        } else {
            // Agregar las nuevas publicaciones
            data.forEach(pub => {
                container.appendChild(crearElementoPublicacion(pub));
            });
            
            // Si obtuvimos menos de lo esperado, no hay más publicaciones
            if (data.length < cantidadPorPagina) {
                document.getElementById('verMasContainer').style.display = 'none';
            } else {
                desde += cantidadPorPagina;
                btnVerMas.disabled = false;
                btnVerMas.innerHTML = 'Ver más';
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        btnVerMas.disabled = false;
        btnVerMas.innerHTML = 'Ver más';
    });
}

// Función para manejar imágenes rotas
function handleImageError(img, titulo) {
    img.src = `https://via.placeholder.com/400x300?text=${encodeURIComponent(titulo || 'Imagen')}`;
}

// Crear elemento HTML de publicación
function crearElementoPublicacion(pub) {
    const div = document.createElement('div');
    div.className = 'publicacion';
    div.id = 'pub-' + pub.id;

    let contenidoHTML = `
        <div class="pub-header">
            <div class="pub-usuario-info">
                <p class="pub-usuario-nombre">${escapeHtml(pub.nombreCompleto)}</p>
                <span class="pub-fecha">@${escapeHtml(pub.nombreUsuario)} · ${formatearFecha(pub.fechaPublicacion)}</span>
            </div>
        </div>

        <h2 class="pub-titulo">${escapeHtml(pub.titulo)}</h2>
        <p class="pub-descripcion">${escapeHtml(pub.descripcion)}</p>
    `;

    if (pub.imagen) {
        const urlImagen = `/images/${escapeHtml(pub.imagen)}`;
        contenidoHTML += `<img src="${urlImagen}" alt="${escapeHtml(pub.titulo)}" class="pub-imagen" onerror="handleImageError(this, '${escapeHtml(pub.titulo)}')">`;
    } else {
        const urlPlaceholder = `https://via.placeholder.com/400x300?text=${encodeURIComponent(pub.titulo || 'Imagen')}`;
        contenidoHTML += `<img src="${urlPlaceholder}" alt="${escapeHtml(pub.titulo)}" class="pub-imagen">`;
    }

    contenidoHTML += `
        <div class="pub-acciones">
            <button class="btn-accion ${pub.meGustaDelUsuario ? 'activo' : ''}" id="btn-like-${pub.id}" onclick="togglearMeGustaBtn(${pub.id}, this)">
                ❤️ <span id="likes-${pub.id}">${pub.cantidadMeGusta}</span>
            </button>
            <button class="btn-accion" onclick="mostrarComentarios(${pub.id})">
                💬 Comentarios
            </button>
        </div>

        <div class="pub-comentarios">
            <div class="comentarios-lista" id="comentarios-${pub.id}" style="display: none;">
                <!-- Los comentarios se cargarán aquí -->
            </div>

            <div class="form-comentario">
                <input type="text" class="input-comentario" id="input-${pub.id}" placeholder="Agrega un comentario..." />
                <button class="btn-comentar" onclick="agregarComentario(${pub.id})">Comentar</button>
            </div>
        </div>
    `;

    div.innerHTML = contenidoHTML;
    return div;
}

// Toggle Me Gusta
function togglearMeGustaBtn(idPublicacion, btnElement) {
    fetch('/Home/TogglearMeGusta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPublicacion: idPublicacion })
    })
    .then(response => response.json())
    .then(data => {
        if (data > -1) {
            document.getElementById('likes-' + idPublicacion).textContent = data;
            btnElement.classList.toggle('activo');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Mostrar comentarios
function mostrarComentarios(idPublicacion) {
    const contenedor = document.getElementById('comentarios-' + idPublicacion);
    
    if (contenedor.style.display === 'none') {
        cargarComentarios(idPublicacion);
        contenedor.style.display = 'flex';
    } else {
        contenedor.style.display = 'none';
    }
}

// Cargar comentarios
function cargarComentarios(idPublicacion) {
    fetch('/Home/ObtenerComentarios?idPublicacion=' + idPublicacion, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        const contenedor = document.getElementById('comentarios-' + idPublicacion);
        contenedor.innerHTML = '';

        data.forEach(coment => {
            const divComent = document.createElement('div');
            divComent.className = 'comentario';
            divComent.innerHTML = `
                <div class="comentario-usuario">@${coment.nombreUsuarioComenta}</div>
                <div class="comentario-texto">${coment.texto}</div>
                <div class="comentario-fecha">${formatearFecha(coment.fechaComentario)}</div>
            `;
            contenedor.appendChild(divComent);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Agregar comentario
function agregarComentario(idPublicacion) {
    const inputComentario = document.getElementById('input-' + idPublicacion).value;

    if (!inputComentario.trim()) {
        alert('El comentario no puede estar vacío');
        return;
    }

    fetch('/Home/AgregarComentario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            idPublicacion: idPublicacion, 
            texto: inputComentario 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data) {
            // Limpiar input
            document.getElementById('input-' + idPublicacion).value = '';
            
            // Recargar comentarios
            cargarComentarios(idPublicacion);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Mostrar botón Ver más
function mostrarBtnVerMas() {
    const container = document.getElementById('verMasContainer');
    if (desde < 1000) { // Si hay más publicaciones potencialmente
        container.style.display = 'flex';
    }
}

// Formatear fecha
function formatearFecha(fechaString) {
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diferencia = ahora - fecha;

    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (segundos < 60) {
        return 'hace unos segundos';
    } else if (minutos < 60) {
        return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else if (horas < 24) {
        return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (dias < 7) {
        return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else {
        return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

// Placeholder para crear publicación
function crearPublicacion() {
    alert('La funcionalidad de crear publicaciones se agregará próximamente');
}
