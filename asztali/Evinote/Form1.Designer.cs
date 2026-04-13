namespace Evinote
{
    partial class Form1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form1));
            this.UserInput = new System.Windows.Forms.TextBox();
            this.PassInput = new System.Windows.Forms.TextBox();
            this.LoginBtn = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // UserInput
            // 
            this.UserInput.BackColor = System.Drawing.Color.AliceBlue;
            this.UserInput.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.UserInput.Font = new System.Drawing.Font("Segoe UI Historic", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.UserInput.Location = new System.Drawing.Point(374, 210);
            this.UserInput.Name = "UserInput";
            this.UserInput.Size = new System.Drawing.Size(224, 25);
            this.UserInput.TabIndex = 0;
            this.UserInput.Text = "Username";
            this.UserInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.UserInput.UseWaitCursor = true;
            // 
            // PassInput
            // 
            this.PassInput.BackColor = System.Drawing.Color.AliceBlue;
            this.PassInput.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.PassInput.Font = new System.Drawing.Font("Segoe UI Historic", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.PassInput.Location = new System.Drawing.Point(374, 241);
            this.PassInput.Name = "PassInput";
            this.PassInput.PasswordChar = '*';
            this.PassInput.ShortcutsEnabled = false;
            this.PassInput.Size = new System.Drawing.Size(224, 25);
            this.PassInput.TabIndex = 1;
            this.PassInput.Text = "Password";
            this.PassInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.PassInput.UseSystemPasswordChar = true;
            // 
            // LoginBtn
            // 
            this.LoginBtn.AccessibleRole = System.Windows.Forms.AccessibleRole.PushButton;
            this.LoginBtn.BackColor = System.Drawing.Color.DodgerBlue;
            this.LoginBtn.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.LoginBtn.Cursor = System.Windows.Forms.Cursors.Arrow;
            this.LoginBtn.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.LoginBtn.Font = new System.Drawing.Font("Segoe UI Historic", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.LoginBtn.Location = new System.Drawing.Point(374, 272);
            this.LoginBtn.Name = "LoginBtn";
            this.LoginBtn.Size = new System.Drawing.Size(224, 31);
            this.LoginBtn.TabIndex = 2;
            this.LoginBtn.Text = "Login";
            this.LoginBtn.UseVisualStyleBackColor = false;
            this.LoginBtn.Click += new System.EventHandler(this.LoginBtn_Click);
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.Black;
            this.BackgroundImage = ((System.Drawing.Image)(resources.GetObject("$this.BackgroundImage")));
            this.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Center;
            this.ClientSize = new System.Drawing.Size(984, 561);
            this.Controls.Add(this.LoginBtn);
            this.Controls.Add(this.PassInput);
            this.Controls.Add(this.UserInput);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "Form1";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox UserInput;
        private System.Windows.Forms.TextBox PassInput;
        private System.Windows.Forms.Button LoginBtn;
    }
}

