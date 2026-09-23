using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using tp.Models;

namespace tp.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
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

    [HttpPost]
    public Comentario? AgregarComentario(int idPublicacion, string texto)
    {
        string? idUsuarioSession = HttpContext.Session.GetString("ID");
        if (string.IsNullOrEmpty(idUsuarioSession))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(texto))
        {
            return null;
        }

        int idUsuario = int.Parse(idUsuarioSession);
        BD bd = new BD();
        
        return bd.CrearComentario(idPublicacion, idUsuario, texto);
    }

    [HttpPost]
    public int TogglearMeGusta(int idPublicacion)
    {
        string? idUsuarioSession = HttpContext.Session.GetString("ID");
        if (string.IsNullOrEmpty(idUsuarioSession))
        {
            return -1;
        }

        int idUsuario = int.Parse(idUsuarioSession);
        BD bd = new BD();
        
        bd.TogglearMeGusta(idPublicacion, idUsuario);
        return bd.ObtenerCantidadMeGusta(idPublicacion);
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
