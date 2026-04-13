using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Evinote
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var key = Form1.ReadSavedApiKey();

            if (!string.IsNullOrWhiteSpace(key))
            {
                var client = new HttpClient();
                Application.Run(new DashboardForm(client));
            }
            else
            {
                Application.Run(new Form1());
            }
        }
    }
}
