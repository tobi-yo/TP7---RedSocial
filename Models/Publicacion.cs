public class Publicacion
{
    public int Id { get; set; }
    public int IdUsuario { get; set; }
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Imagen { get; set; }
    public DateTime FechaPublicacion { get; set; }
    public string? NombreUsuario { get; set; }
    public string? NombreCompleto { get; set; }
    public int CantidadMeGusta { get; set; }
    public bool MeGustaDelUsuario { get; set; }
}
