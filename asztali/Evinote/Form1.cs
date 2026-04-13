using Evinote.Properties;
using Isopoh.Cryptography.Argon2;
using Konscious.Security.Cryptography;
using System;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Windows.Forms;

namespace Evinote
{
    public partial class Form1 : Form
    {
        private static readonly HttpClient client = new HttpClient();
        private static readonly string SessionFilePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Evinote",
            "session.key");

        public Form1()
        {
            InitializeComponent();

            PassInput.UseSystemPasswordChar = true;
            Theme.Apply(this);

            Theme.StyleTextBox(UserInput);
            Theme.StyleTextBox(PassInput);
            Theme.StyleDeleteButton(LoginBtn);
        }

        public static string ReadSavedApiKey()
        {
            try
            {
                if (!File.Exists(SessionFilePath))
                    return null;

                var key = File.ReadAllText(SessionFilePath);
                return string.IsNullOrWhiteSpace(key) ? null : key.Trim();
            }
            catch
            {
                return null;
            }
        }

        private static void SaveApiKey(string apiKey)
        {
            var directory = Path.GetDirectoryName(SessionFilePath);
            if (!Directory.Exists(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(SessionFilePath, apiKey);
        }

        private void OpenDashboard()
        {
            var dashboard = new DashboardForm(client);
            dashboard.Show();
            Hide();
        }


        private async void LoginBtn_Click(object sender, EventArgs e)
        {
            var username = UserInput.Text;
            var password = PassInput.Text;

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                MessageBox.Show("Minden mezőt ki kell tölteni!");
                return;
            }

            var loginData = new LoginRequest(username, password);

            var json = JsonSerializer.Serialize(loginData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            try
            {
                var response = await client.PostAsync("http://localhost:5173/api/auth/login", content);
                var responseBody = await response.Content.ReadAsStringAsync();
                var parsedResponse = JsonSerializer.Deserialize<LoginResponse>(responseBody);

                if (response.IsSuccessStatusCode)
                {
                    if (parsedResponse != null && !string.IsNullOrWhiteSpace(parsedResponse.key))
                    {
                        SaveApiKey(parsedResponse.key);
                    }

                    MessageBox.Show($"Sikeres bejelentkezés! api kulcs: {parsedResponse.key}");
                    OpenDashboard();
                }
                else
                {
                    MessageBox.Show("Hiba: " + responseBody);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.ToString());
            }
        }
    }
}