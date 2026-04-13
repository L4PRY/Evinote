using System;
using System.Drawing;
using System.Windows.Forms;

public static class Theme
{
    public static void Apply(Form form)
    {
        form.BackColor = Color.Black;
        form.ForeColor = Color.White;
    }

    public static void StyleDeleteButton(Button btn)
    {
        btn.FlatStyle = FlatStyle.Flat;
        btn.FlatAppearance.BorderSize = 0;

        btn.BackColor = Color.FromArgb(30, 30, 40);
        btn.ForeColor = Color.White;
        btn.Cursor = Cursors.Hand;

        btn.MouseEnter += (s, e) =>
        {
            btn.BackColor = Color.FromArgb(200, 40, 60);
        };

        btn.MouseLeave += (s, e) =>
        {
            btn.BackColor = Color.FromArgb(30, 30, 40);
        };
    }

    public static void StyleTextBox(TextBox txt)
    {
        txt.BorderStyle = BorderStyle.None;
        txt.BackColor = Color.FromArgb(20, 20, 30);
        txt.ForeColor = Color.White;
        txt.Font = new Font("Segoe UI", 10);
        txt.Height = 30;

        txt.GotFocus += (s, e) =>
        {
            txt.BackColor = Color.FromArgb(30, 30, 45);
        };

        txt.LostFocus += (s, e) =>
        {
            txt.BackColor = Color.FromArgb(20, 20, 30);
        };
    }

    public static void SetPlaceholder(TextBox txt, string placeholder)
    {
        txt.Text = placeholder;
        txt.ForeColor = Color.Gray;

        txt.Enter += (s, e) =>
        {
            if (txt.Text == placeholder)
            {
                txt.Text = "";
                txt.ForeColor = Color.White;
            }
        };

        txt.Leave += (s, e) =>
        {
            if (string.IsNullOrWhiteSpace(txt.Text))
            {
                txt.Text = placeholder;
                txt.ForeColor = Color.Gray;
            }
        };
    }

    public static void StyleDataGrid(DataGridView grid)
    {
        grid.EnableHeadersVisualStyles = false;
        grid.BorderStyle = BorderStyle.None;
        grid.BackgroundColor = Color.FromArgb(15, 15, 20);
        grid.GridColor = Color.FromArgb(40, 40, 50);

        grid.ColumnHeadersDefaultCellStyle.BackColor =
            Color.FromArgb(25, 25, 35);
        grid.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
        grid.ColumnHeadersDefaultCellStyle.Font =
            new Font("Segoe UI", 10, FontStyle.Bold);

        grid.DefaultCellStyle.BackColor =
            Color.FromArgb(20, 20, 30);
        grid.DefaultCellStyle.ForeColor = Color.White;

        grid.DefaultCellStyle.SelectionBackColor =
            Color.FromArgb(150, 80, 255);

        grid.AlternatingRowsDefaultCellStyle.BackColor =
            Color.FromArgb(25, 25, 35);
    }
}