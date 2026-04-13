using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Evinote
{
    using System;
    using System.Text.Json.Serialization;

    public class SessionDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }            // UUID, string

        [JsonPropertyName("token")]
        public string Token { get; set; }

        [JsonPropertyName("userId")]
        public int UserId { get; set; }           // camelCase JSON mező

        [JsonPropertyName("iat")]
        public DateTime Iat { get; set; }         // issued at

        [JsonPropertyName("eat")]
        public DateTime Eat { get; set; }         // expires at

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("location")]
        public string Location { get; set; }     // lehet null
    }
}
