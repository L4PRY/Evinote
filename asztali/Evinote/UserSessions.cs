using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Evinote
{
    public partial class UserSessions : Form
    {
        private readonly int userId;

        public UserSessions(int userId)
        {
            InitializeComponent();
            this.userId = userId;
            Theme.Apply(this);
            Theme.StyleDataGrid(dataGridView1);
        }

        private async void UserSessions_Load(object sender, EventArgs e)
        {
            await LoadBoards();
        }

        private async Task LoadBoards()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization =
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", Form1.ReadSavedApiKey());

                    var response = await client.GetAsync(
                        $"http://localhost:5173/api/users/{userId}/sessions",
                        HttpCompletionOption.ResponseContentRead
                    );

                    if (!response.IsSuccessStatusCode)
                    {
                        MessageBox.Show($"Szerver hiba: {response.StatusCode}");
                        return;
                    }

                    var json = await response.Content.ReadAsStringAsync();

                    var sessions = JsonSerializer.Deserialize<List<SessionDto>>(json, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    dataGridView1.Rows.Clear();

                    // Ha nincs session
                    if (sessions == null || sessions.Count == 0)
                    {
                        MessageBox.Show("Még nem voltak session-ök.");
                        return;
                    }

                    // Betöltés a DataGridView-be
                    foreach (var s in sessions)
                    {
                        int rowIndex = dataGridView1.Rows.Add(
                            s.Id,
                            s.Token,
                            s.UserId,
                            s.Iat.ToString("yyyy-MM-dd HH:mm"),
                            s.Eat.ToString("yyyy-MM-dd HH:mm"),
                            s.Description,
                            s.Location
                        );

                        dataGridView1.Rows[rowIndex].Tag = s;
                    }
                }
            }
            catch (JsonException ex)
            {
                MessageBox.Show("JSON feldolgozási hiba! Valószínűleg nem érvényes adatot kaptunk a szervertől.\n" + ex.Message);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Váratlan hiba: " + ex.Message);
            }
        }
    }
}
