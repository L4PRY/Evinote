using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Evinote
{
    public partial class DashboardForm : Form
    {
        private HttpClient _client;

        public DashboardForm(HttpClient client)
        {
            InitializeComponent();
            _client = client;
            this.Load += DashboardForm_Load;
            Theme.Apply(this);

            Theme.StyleDeleteButton(DeleteBtn);
            Theme.StyleDataGrid(dataGridView1);
            Theme.StyleDataGrid(dataGridView2);
        }

        private async void DashboardForm_Load(object sender, EventArgs e)
        {
            await LoadUsers();
        }

private async Task LoadUsers()
{
    try
    {
        var response = await _client.GetAsync("http://localhost:5173/api/users");
        var json = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            MessageBox.Show("Hiba az API hívásnál");
            return;
        }

        var users = JsonSerializer.Deserialize<List<UserDto>>(json,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        dataGridView1.Rows.Clear();
        dataGridView2.Rows.Clear();

        if (users == null)
        {
            MessageBox.Show("Null a users lista");
            return;
        }

        foreach (var user in users)
        {
            DateTime created = user.created_at;
            DateTime updated = user.updated_at;

            // MAIN USER TABLE
            var rowIndex = dataGridView1.Rows.Add(
                user.id,
                user.username,
                user.email,
                created.ToLocalTime().ToString("yyyy.MM.dd"),
                "Show sessions",
                "Show boards"
            );

            dataGridView1.Rows[rowIndex].Tag = user;

            // ADMIN LIST
            if (user.username != null && user.role == "Admin")
            {
                var rowIndex2 = dataGridView2.Rows.Add(
                    user.username,
                    user.role
                );
                dataGridView2.Rows[rowIndex2].Tag = user;

            }
        }
    }
    catch (Exception ex)
    {
        MessageBox.Show(ex.ToString());
    }
}

        public async Task DeleteUser(int id)
        {
            try
            {
                _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", Form1.ReadSavedApiKey());
                var response = await _client.DeleteAsync($"http://localhost:5173/api/users/{id}");


                if (response.IsSuccessStatusCode)
                {
                    MessageBox.Show("Felhasználó törölve!");
                    await LoadUsers();
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    MessageBox.Show("Hiba: " + error + "\n" + "id: " + id);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.ToString());
            }
        }

        private async void DeleteBtn_Click(object sender, EventArgs e)
        {
            if (dataGridView1.CurrentRow == null)
            {
                MessageBox.Show("Nincs kiválasztott felhasználó!");
                return;
            }

            var selectedUser = (UserDto)dataGridView1.CurrentRow.Tag;

            var confirm = MessageBox.Show(
                $"Biztosan törölni szeretnéd ezt a felhasználót?\n\n{selectedUser.username}",
                "Megerősítés",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning
            );

            if (confirm != DialogResult.Yes)
                return;

            await DeleteUser(selectedUser.id);
        }

        private void dataGridView1_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.ColumnIndex == 5 && e.RowIndex >= 0)
            {
                var selectedUser = (UserDto)dataGridView1.Rows[e.RowIndex].Tag;

                var dashboards = new UserBoards(selectedUser.id.ToString());
                dashboards.ShowDialog();
            }
            if (e.ColumnIndex == 4 && e.RowIndex >= 0)
            {
                var selectedUser = (UserDto)dataGridView1.Rows[e.RowIndex].Tag;

                var sessions = new UserSessions(selectedUser.id);
                sessions.ShowDialog();
            }
        }

    }
}
