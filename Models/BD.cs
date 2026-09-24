using Dapper;
using Microsoft.Data.SqlClient;

public class BD
{
    private static string connectionString = @"Server=localhost;DataBase=DBRedSocial;Integrated Security=True;TrustServerCertificate=True;";

    public int crearCuenta(Cuenta cuenta)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            return connection.Execute("INSERT INTO Usuarios (NombreUsuario, Contraseña, Nombre, Apellido) VALUES (@NombreUsuario, @Contraseña, @Nombre, @Apellido)", cuenta);
        }
    }

    public List<string> obtenerUsuarios()
    {
        using (var connection = new SqlConnection(connectionString))
        {
            return connection.Query<string>("SELECT NombreUsuario FROM Usuarios").ToList();
        }
    }

    public Cuenta iniciarSesion(string nombreUsuario, string contraseña)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            return connection.Query<Cuenta>("SELECT * FROM Usuarios WHERE NombreUsuario = @NombreUsuario AND Contraseña = @Contraseña", new { NombreUsuario = nombreUsuario, Contraseña = contraseña }).FirstOrDefault();
        }
    }

    public List<string> obtenerNombres()
    {
        using (var connection = new SqlConnection(connectionString))
        {
            return connection.Query<string>("SELECT NombreUsuario FROM Usuarios").ToList();
        }
    }

    public List<HistoriaUsuario> ObtenerHistorias(int cantidad = 7)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = @"
                SELECT TOP (@Cantidad)
                    Id,
                    NombreUsuario,
                    Nombre,
                    Apellido,
                    LEFT(UPPER(ISNULL(Nombre, '') + ' ' + ISNULL(Apellido, '')), 2) AS Iniciales
                FROM Usuarios
                ORDER BY Id DESC";

            return connection.Query<HistoriaUsuario>(query, new { Cantidad = cantidad }).ToList();
        }
    }

    public int CrearPublicacion(Publicacion publicacion)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = @"
                INSERT INTO Publicaciones (IdUsuario, Titulo, Descripcion, Imagen, FechaPublicacion)
                VALUES (@IdUsuario, @Titulo, @Descripcion, @Imagen, @FechaPublicacion);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            return connection.QuerySingle<int>(query, publicacion);
        }
    }

    public List<Publicacion> ObtenerPublicaciones(int skip = 0, int take = 10)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = @"
                  SELECT p.Id, p.IdUsuario, p.Titulo, p.Descripcion, p.Imagen, p.FechaPublicacion,
                       u.NombreUsuario, u.Nombre + ' ' + u.Apellido as NombreCompleto,
                      (SELECT COUNT(*) FROM PublicacionesMeGusta WHERE IdPublicación = p.Id) as CantidadMeGusta,
                      (SELECT COUNT(*) FROM Comentarios WHERE IdPublicacion = p.Id) as CantidadComentarios
                FROM Publicaciones p
                INNER JOIN Usuarios u ON p.IdUsuario = u.Id
                ORDER BY p.FechaPublicacion DESC
                OFFSET @Skip ROWS
                FETCH NEXT @Take ROWS ONLY";
            
            return connection.Query<Publicacion>(query, new { Skip = skip, Take = take }).ToList();
        }
    }

    public List<Comentario> ObtenerComentarios(int idPublicacion)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = @"
                SELECT c.Id, c.IdPublicacion, c.IdUsuarioComenta, c.Texto, c.FechaComentario,
                       u.NombreUsuario as NombreUsuarioComenta
                FROM Comentarios c
                INNER JOIN Usuarios u ON c.IdUsuarioComenta = u.Id
                WHERE c.IdPublicacion = @IdPublicacion
                ORDER BY c.FechaComentario ASC";
            
            return connection.Query<Comentario>(query, new { IdPublicacion = idPublicacion }).ToList();
        }
    }

    public bool VerificarMeGusta(int idPublicacion, int idUsuario)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = "SELECT COUNT(*) FROM PublicacionesMeGusta WHERE IdPublicación = @IdPublicacion AND IdUsuario = @IdUsuario";
            int resultado = connection.QueryFirstOrDefault<int>(query, new { IdPublicacion = idPublicacion, IdUsuario = idUsuario });
            return resultado > 0;
        }
    }

    public bool ExistePublicacion(int idPublicacion)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = "SELECT COUNT(*) FROM Publicaciones WHERE Id = @IdPublicacion";
            int resultado = connection.QueryFirstOrDefault<int>(query, new { IdPublicacion = idPublicacion });
            return resultado > 0;
        }
    }

    public bool TogglearMeGusta(int idPublicacion, int idUsuario)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            if (VerificarMeGusta(idPublicacion, idUsuario))
            {
                string deleteQuery = "DELETE FROM PublicacionesMeGusta WHERE IdPublicación = @IdPublicacion AND IdUsuario = @IdUsuario";
                connection.Execute(deleteQuery, new { IdPublicacion = idPublicacion, IdUsuario = idUsuario });
                return false;
            }
            else
            {
                string insertQuery = "INSERT INTO PublicacionesMeGusta (IdPublicación, IdUsuario) VALUES (@IdPublicacion, @IdUsuario)";
                connection.Execute(insertQuery, new { IdPublicacion = idPublicacion, IdUsuario = idUsuario });
                return true;
            }
        }
    }

    public Comentario CrearComentario(int idPublicacion, int idUsuario, string texto)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string insertQuery = "INSERT INTO Comentarios (IdPublicacion, IdUsuarioComenta, Texto, FechaComentario) VALUES (@IdPublicacion, @IdUsuarioComenta, @Texto, @FechaComentario)";
            
            DateTime fechaActual = DateTime.Now;
            connection.Execute(insertQuery, new { 
                IdPublicacion = idPublicacion, 
                IdUsuarioComenta = idUsuario, 
                Texto = texto,
                FechaComentario = fechaActual
            });

            string selectQuery = @"
                SELECT c.Id, c.IdPublicacion, c.IdUsuarioComenta, c.Texto, c.FechaComentario,
                       u.NombreUsuario as NombreUsuarioComenta
                FROM Comentarios c
                INNER JOIN Usuarios u ON c.IdUsuarioComenta = u.Id
                WHERE c.Id = (SELECT MAX(Id) FROM Comentarios WHERE IdPublicacion = @IdPublicacion AND IdUsuarioComenta = @IdUsuarioComenta)";
            
            return connection.Query<Comentario>(selectQuery, new { IdPublicacion = idPublicacion, IdUsuarioComenta = idUsuario }).FirstOrDefault();
        }
    }

    public int ObtenerCantidadMeGusta(int idPublicacion)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            string query = "SELECT COUNT(*) FROM PublicacionesMeGusta WHERE IdPublicación = @IdPublicacion";
            return connection.QueryFirstOrDefault<int>(query, new { IdPublicacion = idPublicacion });
        }
    }

}