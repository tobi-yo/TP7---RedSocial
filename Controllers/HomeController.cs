using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using tp.Models;

namespace tp.Controllers;

public sealed class ToggleMeGustaRequest
{
    public int IdPublicacion { get; set; }
}

public sealed class CrearComentarioRequest
{
    public int IdPublicacion { get; set; }
    public string? Texto { get; set; }
}

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly IWebHostEnvironment _webHostEnvironment;

    public HomeController(ILogger<HomeController> logger, IWebHostEnvironment webHostEnvironment)
    {
        _logger = logger;
        _webHostEnvironment = webHostEnvironment;
    }

    public IActionResult Index()
    {
        if (HttpContext.Session.GetString("ID") != null)
        {
            return RedirectToAction("paginaPrincipal");
        }
        return View();
    }

    public IActionResult IniciarSesion()
    {
        return View();
    }

    public IActionResult ValidarCuenta(string nombreUsuario, string contraseña)
    {
        BD bd = new BD();
        Cuenta cuenta = bd.iniciarSesion(nombreUsuario, contraseña);
        if (cuenta == null)
        {
            string error = "El usuario y la contraseña no coinsiden.";
            ViewBag.Mensaje = error;
            return View("IniciarSesion");
        }
        HttpContext.Session.SetString("ID", cuenta.ID.ToString());
        HttpContext.Session.SetString("NombreUsuario", cuenta.NombreUsuario ?? string.Empty);
        HttpContext.Session.SetString("Nombre", cuenta.Nombre ?? string.Empty);
        HttpContext.Session.SetString("Apellido", cuenta.Apellido ?? string.Empty);

        return View("Bienvenida");
    }
    
    public IActionResult CerrarSesion(){
        HttpContext.Session.Clear();
        return View("Index");
    }

    public IActionResult Registrarse()
    {
        return View();
    }

    public IActionResult CrearCuenta(Cuenta cuenta)
    {
        BD bd = new BD();
        List<string> usuariosExistentes = bd.obtenerNombres();
        if (usuariosExistentes.Contains(cuenta.NombreUsuario))
        {
            string error = "El nombre de usuario ya está en uso. Por favor, elige otro.";
            ViewBag.Mensaje = error;
            return View("Registrarse");
        } else {
            int resultado = bd.crearCuenta(cuenta);
        }
        return View("index");
    }

    public IActionResult Bienvenida()
    {
        return View();
    }

    public IActionResult paginaPrincipal()
    {
        return View();
    }

    public IActionResult CrearPublicacion()
    {
        if (HttpContext.Session.GetString("ID") == null)
        {
            return RedirectToAction("IniciarSesion");
        }

        return View();
    }

    [HttpPost]
    public IActionResult CrearPublicacion(string titulo, string descripcion, IFormFile imagen)
    {
        string? idUsuarioSession = HttpContext.Session.GetString("ID");
        if (string.IsNullOrEmpty(idUsuarioSession))
        {
            return RedirectToAction("IniciarSesion");
        }

        if (string.IsNullOrWhiteSpace(titulo) || string.IsNullOrWhiteSpace(descripcion) || imagen == null || imagen.Length == 0)
        {
            ViewBag.Mensaje = "Completá todos los campos y seleccioná una imagen.";
            return View();
        }

        string[] extensionesPermitidas = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        string extension = Path.GetExtension(imagen.FileName).ToLowerInvariant();
        if (!extensionesPermitidas.Contains(extension) || !imagen.ContentType.StartsWith("image/"))
        {
            ViewBag.Mensaje = "La imagen debe ser JPG, PNG, GIF o WEBP.";
            return View();
        }

        string carpetaImagenes = Path.Combine(_webHostEnvironment.WebRootPath, "images", "publicaciones");
        Directory.CreateDirectory(carpetaImagenes);

        string nombreArchivo = $"pub_{Guid.NewGuid():N}{extension}";
        string rutaDestino = Path.Combine(carpetaImagenes, nombreArchivo);

        using (var stream = new FileStream(rutaDestino, FileMode.Create))
        {
            imagen.CopyTo(stream);
        }

        int idUsuario = int.Parse(idUsuarioSession);
        Publicacion publicacion = new Publicacion
        {
            IdUsuario = idUsuario,
            Titulo = titulo.Trim(),
            Descripcion = descripcion.Trim(),
            Imagen = nombreArchivo,
            FechaPublicacion = DateTime.Now
        };

        BD bd = new BD();
        bd.CrearPublicacion(publicacion);

        return RedirectToAction("paginaPrincipal");
    }

    [HttpGet]
    public List<HistoriaUsuario> ObtenerHistorias(int cantidad = 7)
    {
        BD bd = new BD();
        return bd.ObtenerHistorias(cantidad);
    }

    [HttpGet]
    public List<Publicacion> ObtenerPublicaciones(int desde = 0, int cantidad = 10)
    {
        BD bd = new BD();
        List<Publicacion> publicaciones = bd.ObtenerPublicaciones(desde, cantidad);
        
        if (publicaciones.Count > 0)
        {
            int idUsuarioActual = int.Parse(HttpContext.Session.GetString("ID") ?? "0");
            foreach (var pub in publicaciones)
            {
                pub.MeGustaDelUsuario = bd.VerificarMeGusta(pub.Id, idUsuarioActual);
            }
        }
        
        return publicaciones;
    }

    [HttpGet]
    public List<Comentario> ObtenerComentarios(int idPublicacion)
    {
        BD bd = new BD();
        return bd.ObtenerComentarios(idPublicacion);
    }

    [HttpPost("Home/AgregarComentario")]
    public IActionResult AgregarComentario([FromBody] CrearComentarioRequest request)
    {
        string? idUsuarioSession = HttpContext.Session.GetString("ID");
        if (string.IsNullOrEmpty(idUsuarioSession))
        {
            return Unauthorized(new { success = false, message = "Sesión no válida." });
        }

        if (request == null || request.IdPublicacion <= 0)
        {
            return BadRequest(new { success = false, message = "Publicación inválida." });
        }

        if (string.IsNullOrWhiteSpace(request.Texto))
        {
            return BadRequest(new { success = false, message = "El comentario no puede estar vacío." });
        }

        int idUsuario = int.Parse(idUsuarioSession);
        BD bd = new BD();

        if (!bd.ExistePublicacion(request.IdPublicacion))
        {
            return NotFound(new { success = false, message = "La publicación no existe." });
        }
        
        Comentario? comentario = bd.CrearComentario(request.IdPublicacion, idUsuario, request.Texto.Trim());
        if (comentario == null)
        {
            return StatusCode(500, new { success = false, message = "No se pudo guardar el comentario." });
        }

        return Json(new
        {
            success = true,
            comentario
        });
    }

    [HttpPost("Home/TogglearMeGusta")]
    public IActionResult TogglearMeGusta([FromBody] ToggleMeGustaRequest request)
    {
        string? idUsuarioSession = HttpContext.Session.GetString("ID");
        if (string.IsNullOrEmpty(idUsuarioSession))
        {
            return Unauthorized(new { success = false, message = "Sesión no válida." });
        }

        if (request == null || request.IdPublicacion <= 0)
        {
            return BadRequest(new { success = false, message = "Publicación inválida." });
        }

        int idUsuario = int.Parse(idUsuarioSession);
        BD bd = new BD();

        if (!bd.ExistePublicacion(request.IdPublicacion))
        {
            return NotFound(new { success = false, message = "La publicación no existe." });
        }

        bool meGusta = bd.TogglearMeGusta(request.IdPublicacion, idUsuario);
        int cantidadMeGusta = bd.ObtenerCantidadMeGusta(request.IdPublicacion);

        return Json(new
        {
            success = true,
            meGusta,
            activo = meGusta,
            cantidadMeGusta
        });
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
