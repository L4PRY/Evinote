using System;

namespace Evinote
{
    public class UserDto
    {
        public int id { get; set; }
        public string username { get; set; }
        public string email { get; set; }
        public string role { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }

        public UserDto() { }

        public UserDto(int id, string username, string email, string role, DateTime created_at, DateTime updated_at)
        {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.created_at = created_at;
            this.updated_at = updated_at;
        }
    }
}