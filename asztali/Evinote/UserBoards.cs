using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Evinote
{
    // Ez az osztály felel az adatok szerkezetéért
    public partial class UserBoards : Form
    {
        private readonly string userId;

        public UserBoards(string userId)
        {
            InitializeComponent();
            this.userId = userId;
            this.Load += UserBoards_Load;
            Theme.Apply(this);

            Theme.StyleTextBox(updateBtnTextBox);

            Theme.StyleDeleteButton(deleteBoardBtn);
            Theme.StyleDeleteButton(updateBtn);
            Theme.StyleDataGrid(dataGridView1);
        }

        private async void UserBoards_Load(object sender, EventArgs e)
        {
            await LoadBoards();
        }

        private async Task LoadBoards()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Form1.ReadSavedApiKey());
                    var url = $"http://localhost:5173/api/users/{userId}/boards";
                    var response = await client.GetAsync(url, HttpCompletionOption.ResponseContentRead); ;
                    var raw = await response.Content.ReadAsStringAsync();

                    if (!raw.Trim().StartsWith("[") && !raw.Trim().StartsWith("{"))
                    {
                        MessageBox.Show("VIGYÁZAT: Nem JSON érkezett!\n\nA válasz eleje:\n" +
                                        (raw.Length > 500 ? raw.Substring(0, 500) : raw),
                                        "Szerver válasza");
                        return;
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        MessageBox.Show($"Szerver hiba: {response.StatusCode}");
                        return;
                    }

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var boards = JsonSerializer.Deserialize<List<BoardDto>>(raw, options) ?? new List<BoardDto>();

                    dataGridView1.Rows.Clear();

                    foreach (var b in boards)
                    {
                        int rowIndex = dataGridView1.Rows.Add(
                            b.Id.ToString(),
                            b.Name,
                            b.Type,
                            b.NotesCount,
                            b.Updated.ToString("yyyy-MM-dd")
                        );

                        dataGridView1.Rows[rowIndex].Tag = b;
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

        private void dataGridView1_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }

        private void tableLayoutPanel1_Paint(object sender, PaintEventArgs e)
        {

        }

        private async void deleteBoardBtn_Click(object sender, EventArgs e)
        {
            // Ellenőrizzük, hogy van-e kijelölt sor
            if (dataGridView1.SelectedRows.Count > 0)
            {
                var selectedBoard = dataGridView1.SelectedRows[0].Tag as BoardDto;

                if (selectedBoard != null)
                {
                    var confirmResult = MessageBox.Show(
                        $"Biztosan törölni szeretnéd a '{selectedBoard.Name}' nevű boardot?",
                        "Törlés megerősítése",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Warning);

                    if (confirmResult == DialogResult.Yes)
                    {
                        try
                        {
                            using (var client = new HttpClient())
                            {
                                // 1. API hívás összeállítása (DELETE metódus)
                                var url = $"http://localhost:5173/api/boards/{selectedBoard.Id}";
                                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Form1.ReadSavedApiKey());
                                var response = await client.DeleteAsync(url);

                                if (response.IsSuccessStatusCode)
                                {
                                    MessageBox.Show("Sikeres törlés!");

                                    // 2. Táblázat frissítése a szerverről
                                    await LoadBoards();
                                }
                                else
                                {
                                    // Itt jöhet vissza a HTML hiba, ha pl. nincs bejelentkezvein vagy nincs jogosultság
                                    var errorRaw = await response.Content.ReadAsStringAsync();
                                    MessageBox.Show($"Hiba a törlés során: {response.StatusCode}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            MessageBox.Show("Hiba történt a hálózati kommunikáció során: " + ex.Message);
                        }
                    }
                }
            }
            else
            {
                MessageBox.Show("Kérlek, jelöld ki a teljes sort a törléshez! (Kattints a sor elejére)");
            }
        }

        private void updateBtnTextBox_Click(object sender, EventArgs e)
        {
            if (updateBtnTextBox.Text == "Új név:")
            {
                updateBtnTextBox.Clear();
            }
        }

        private async void updateBtn_Click(object sender, EventArgs e)
        {
            if (dataGridView1.SelectedRows.Count > 0)
            {
                var selectedBoard = dataGridView1.SelectedRows[0].Tag as BoardDto;
                if (selectedBoard != null)
                {
                    var newName = updateBtnTextBox.Text.Trim();
                    if (string.IsNullOrEmpty(newName))
                    {
                        MessageBox.Show("Kérlek, adj meg egy új nevet a boardnak!");
                        return;
                    }
                    // Itt jöhetne egy API hívás a board nevének frissítésére
                    var confirmResult = MessageBox.Show(
                        $"Szeretnéd megváltoztatni a '{selectedBoard.Name}' nevét '{newName}'-re?",
                        "Név módosítás megerősítése",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question);
                    if (confirmResult == DialogResult.Yes)
                    {
                        try
                        {
                            using (var client = new HttpClient())
                            {
                                var url = $"http://localhost:5173/api/boards/{selectedBoard.Id}";
                                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Form1.ReadSavedApiKey());
                                var content = new StringContent(JsonSerializer.Serialize(new { name = newName }), System.Text.Encoding.UTF8, "application/json");
                                
                                var request = new HttpRequestMessage(new HttpMethod("PATCH"), url)
                                {
                                    Content = content
                                };
                                var response = await client.SendAsync(request);

                                if (response.IsSuccessStatusCode)
                                {
                                    MessageBox.Show("Sikeres név módosítás!");
                                    await LoadBoards();
                                }
                                else
                                {
                                    MessageBox.Show($"Hiba a név módosítása során: {response.StatusCode}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            MessageBox.Show("Hiba történt a hálózati kommunikáció során: " + ex.Message);
                        }
                    }
                }
            }
            else
            {
                MessageBox.Show("Kérlek, jelöld ki a teljes sort a név módosításához! (Kattints a sor elejére)");
            }

        }
    }
}