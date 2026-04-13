using Konscious.Security.Cryptography;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Evinote
{
    public class PasswordHasher
    {
        public string HashPassword(string password)
        {
            // Alakítsd a jelszót byte[]-re
            byte[] passwordBytes = Encoding.UTF8.GetBytes(password);

            using (var argon2 = new Argon2id(passwordBytes))
            {
                // 16 bájtos véletlenszerű salt generálása
                byte[] salt = new byte[16];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(salt);
                }
                argon2.Salt = salt;

                // Argon2 paraméterek
                argon2.DegreeOfParallelism = 4; // párhuzamos szálak
                argon2.MemorySize = 65536;      // memória KB-ban (64 MB)
                argon2.Iterations = 4;          // iterációk

                // 32 bájtos hash generálása
                byte[] hash = argon2.GetBytes(32);

                // Base64 string a küldéshez
                return Convert.ToBase64String(hash);
            }
        }
    }
}
