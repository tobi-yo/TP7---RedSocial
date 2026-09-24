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
function cargarHistorias() {
    fetch('/Home/ObtenerHistorias?cantidad=7', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('historiasContainer');
        if (!container) return;

        container.innerHTML = '';

        const propia = document.createElement('div');
        propia.className = 'story-item own';
        propia.innerHTML = `
            <div class="story-ring">+</div>
            <span>Tu historia</span>
        `;
        container.appendChild(propia);

        data.forEach((usuario, index) => {
            const story = document.createElement('div');
            story.className = 'story-item';
            const variante = index % 4;
            story.innerHTML = `
                <div class="story-ring story-${variante}">${escapeHtml(usuario.iniciales || obtenerIniciales(obtenerNombreHistoria(usuario)))}</div>
                <span>${escapeHtml(usuario.nombreUsuario || 'Usuario')}</span>
            `;
            container.appendChild(story);
        });
    })
    .catch((error) => {
        console.error('Error al cargar historias:', error);
    });
}

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
    const claseLike = pub.meGustaDelUsuario ? 'activo' : '';
    const textoLike = pub.meGustaDelUsuario ? 'Ya no me gusta' : 'Me gusta';
    const cantidadComentarios = Number(pub.cantidadComentarios || 0);

    let contenidoHTML = `
        <div class="pub-header">
            <div class="pub-user-chip">
                <div class="pub-avatar">${obtenerIniciales(pub.nombreCompleto || pub.nombreUsuario)}</div>
                <div class="pub-usuario-info">
                    <p class="pub-usuario-nombre">${escapeHtml(pub.nombreCompleto)}</p>
                    <span class="pub-fecha">@${escapeHtml(pub.nombreUsuario)} · ${formatearFecha(pub.fechaPublicacion)}</span>
                </div>
            </div>
            <button type="button" class="pub-more-btn" aria-label="Más opciones">⋯</button>
        </div>

        <h2 class="pub-titulo">${escapeHtml(pub.titulo)}</h2>
        <p class="pub-descripcion">${escapeHtml(pub.descripcion)}</p>
    `;

    if (pub.imagen) {
        const urlImagen = `/images/publicaciones/${escapeHtml(pub.imagen)}`;
        contenidoHTML += `<img src="${urlImagen}" alt="${escapeHtml(pub.titulo)}" class="pub-imagen" onerror="handleImageError(this, '${escapeHtml(pub.titulo)}')">`;
    } else {
        const urlPlaceholder = `https://via.placeholder.com/400x300?text=${encodeURIComponent(pub.titulo || 'Imagen')}`;
        contenidoHTML += `<img src="${urlPlaceholder}" alt="${escapeHtml(pub.titulo)}" class="pub-imagen">`;
    }

    contenidoHTML += `
        <div class="pub-acciones">
            <button type="button" class="btn-accion btn-like ${claseLike}" id="btn-like-${pub.id}" aria-pressed="${pub.meGustaDelUsuario ? 'true' : 'false'}" onclick="togglearMeGustaBtn(${pub.id}, this)">
                <span class="like-icon" aria-hidden="true">${pub.meGustaDelUsuario ? '♥' : '♡'}</span>
                <span class="like-text">${textoLike}</span>
                <span id="likes-${pub.id}">${pub.cantidadMeGusta}</span>
            </button>
            <button type="button" class="btn-accion btn-comentarios" id="btn-comentarios-${pub.id}" aria-expanded="false" onclick="mostrarComentarios(${pub.id}, this)">
                <span class="comment-icon" aria-hidden="true">💬</span>
                <span class="comment-text">Comentarios</span>
                <span class="comment-count" id="comentarios-count-${pub.id}">${cantidadComentarios > 0 ? cantidadComentarios : ''}</span>
            </button>
        </div>

        <div class="pub-comentarios" id="panel-comentarios-${pub.id}" style="display: none;">
            <div class="comentarios-lista" id="comentarios-${pub.id}" style="display: none;">
                <!-- Los comentarios se cargarán aquí -->
            </div>

            <div class="form-comentario">
                <input type="text" class="input-comentario" id="input-${pub.id}" placeholder="Agrega un comentario..." onkeydown="manejarEnterComentario(event, ${pub.id})" />
                <button type="button" class="btn-comentar" onclick="agregarComentario(${pub.id})">Publicar</button>
            </div>
        </div>
    `;

    div.innerHTML = contenidoHTML;
    return div;
}

function obtenerIniciales(texto) {
    const partes = (texto || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
}

function obtenerNombreHistoria(usuario) {
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
    return nombreCompleto || usuario.nombreUsuario || 'Usuario';
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
        if (data && data.success) {
            document.getElementById('likes-' + idPublicacion).textContent = data.cantidadMeGusta;
            actualizarEstadoLike(btnElement, data.activo === true || data.meGusta === true);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function actualizarEstadoLike(btnElement, meGusta) {
    btnElement.classList.toggle('activo', meGusta);
    btnElement.setAttribute('aria-pressed', meGusta ? 'true' : 'false');

    if (meGusta) {
        btnElement.style.setProperty('background', 'linear-gradient(135deg, #f59e0b, #f97316)', 'important');
        btnElement.style.setProperty('color', '#ffffff', 'important');
        btnElement.style.setProperty('box-shadow', '0 8px 18px rgba(249, 115, 22, 0.25)', 'important');
    } else {
        btnElement.style.setProperty('background', 'rgba(37, 99, 235, 0.1)', 'important');
        btnElement.style.setProperty('color', 'var(--primary-color)', 'important');
        btnElement.style.setProperty('box-shadow', 'none', 'important');
    }

    const icon = btnElement.querySelector('.like-icon');
    if (icon) {
        icon.textContent = meGusta ? '♥' : '♡';
    }

    const texto = btnElement.querySelector('.like-text');
    if (texto) {
        texto.textContent = meGusta ? 'Ya no me gusta' : 'Me gusta';
    }
}

// Mostrar comentarios
function mostrarComentarios(idPublicacion, btnElement) {
    const contenedor = document.getElementById('comentarios-' + idPublicacion);
    const panel = document.getElementById('panel-comentarios-' + idPublicacion);
    const boton = btnElement || document.getElementById('btn-comentarios-' + idPublicacion);
    const estaVisible = panel.style.display !== 'none' && panel.style.display !== '' ? true : false;
    
    if (!estaVisible) {
        cargarComentarios(idPublicacion);
        panel.style.display = 'block';
        contenedor.style.display = 'flex';
        if (boton) {
            boton.setAttribute('aria-expanded', 'true');
            boton.classList.add('activo');
        }
        setTimeout(() => {
            const input = document.getElementById('input-' + idPublicacion);
            if (input) input.focus();
        }, 0);
    } else {
        contenedor.style.display = 'none';
        panel.style.display = 'none';
        if (boton) {
            boton.setAttribute('aria-expanded', 'false');
            boton.classList.remove('activo');
        }
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
        const countEl = document.getElementById('comentarios-count-' + idPublicacion);
        if (countEl) {
            countEl.textContent = data.length ? `${data.length}` : '';
        }

        data.forEach(coment => {
            contenedor.appendChild(crearElementoComentario(coment));
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function crearElementoComentario(coment) {
    const divComent = document.createElement('div');
    divComent.className = 'comentario';
    divComent.innerHTML = `
        <div class="comentario-usuario">@${escapeHtml(coment.nombreUsuarioComenta || 'Usuario')}</div>
        <div class="comentario-texto">${escapeHtml(coment.texto || '')}</div>
        <div class="comentario-fecha">${formatearFecha(coment.fechaComentario)}</div>
    `;
    return divComent;
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
        if (data && data.success && data.comentario) {
            // Limpiar input
            document.getElementById('input-' + idPublicacion).value = '';

            const contenedor = document.getElementById('comentarios-' + idPublicacion);
            const panel = document.getElementById('panel-comentarios-' + idPublicacion);
            const boton = document.getElementById('btn-comentarios-' + idPublicacion);
            const countEl = document.getElementById('comentarios-count-' + idPublicacion);

            if (panel) {
                panel.style.display = 'block';
            }
            if (contenedor) {
                contenedor.style.display = 'flex';
                contenedor.appendChild(crearElementoComentario(data.comentario));
            }

            if (countEl) {
                const current = parseInt(countEl.textContent || '0', 10);
                const next = isNaN(current) ? 1 : current + 1;
                countEl.textContent = String(next);
            }
            if (boton) {
                boton.classList.add('activo');
                boton.setAttribute('aria-expanded', 'true');
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function manejarEnterComentario(event, idPublicacion) {
    if (event.key === 'Enter') {
        event.preventDefault();
        agregarComentario(idPublicacion);
    }
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
    window.location.href = '/Home/CrearPublicacion';
}
