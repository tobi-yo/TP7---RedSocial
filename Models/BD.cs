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

}