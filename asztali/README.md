# 🧠 EviNoteAlk

**EviNoteAlk** egy vizsgaremek projekt, amely egy asztali adatkezelő alkalmazás C#/.NET környezetben.  
Célja, hogy a felhasználók, táblák és sessionök kezelését, megtekintését könnyen, áttekinthető felületen valósítsa meg.

---

## 📌 Tartalomjegyzék

1. 🧩 Bemutatás
2. 🚀 Fő funkciók
3. 🛠️ Telepítés
4. ▶️ Használat
5. 📁 Projekt struktúra
6. 📞  Készítők

---

## 🧩 Bemutatás

**EviNoteAlk** egy asztali alkalmazás, amely a következő célokra készült:

- Felhasználók, táblák és sessionök kezelésére;
- Adatok áttekinthető listázására és szerkesztésére;
- Admnisztrációs felületet kínál a moderálás céljából

Ez a vizsgaremek demonstrálja a .NET és adatbázis-kezelésben szerzett jártasságot, felhasználói felületet és adatkezelést egyaránt.

---

## 🚀 Fő funkciók

Az alkalmazás fő funkciói:

### 👤 Felhasználók kezelése
- Felhasználók listázása
- Felhasználók törlése
- Felhasználói adatok áttekintése

### 📊 Táblák kezelése
- Táblák megnyitása és ki listázása
- Táblák törlése
- Táblák átnevezése

### 💻 Sessionök kezelése
- Sessionök megnyitása
- Sessionök listázása
- Kapcsolódó adatok megtekintése

Az alkalmazás így teljes körűen lehetővé teszi az adatbázisok kezelését és felügyeletét vizsga környezetben is.

---

## 🛠️ Telepítés

---

### 📦 Lépések
- Töltsük le a Zip fájlt
- Csomagoljuk ki az asztalra
- Evinote.exe fájlt telepítsük
- Terminálból indítsuk el a Backendet
- Majd futassuk

---

### ▶️ Használat
- Törlés funkció: Felhasználók törlésére szolgál | Jelöljük ki a törölni kívánt felhasználót és nyomjunk a törlés gombra.
- Show Sessions funkció: Aktivitásokat listáz | Csak megtekintésre alkalmas
- Show Boards funckió: A Táblák kezelésére szolgáló menüpont | Jelöljük ki a törölni kívánt táblát és nyomjunk a törlés gombra | Jelöljük ki a módosítani kívánt táblát majd az "Új név:" bemeneti formátumra kattintva adjuk meg az új nevet, majd nyomjunk a Módosítás gombra

---

### 📁 Projekt struktúra

Evinote/
│
├── Components/                 # Egyedi UI komponensek
│   └── Theme.cs               # Megjelenés / téma kezelés
│
├── Properties/                # Projekt beállítások (auto-generált)
│   ├── AssemblyInfo.cs
│   ├── Resources.resx
│   └── Settings.settings
│
├── Resources/                 # Erőforrások (képek, ikonok stb.)
│
├── App.config                 # Alkalmazás konfiguráció
├── packages.config           # NuGet csomagok listája
│
├── Program.cs                # Alkalmazás belépési pontja
│
├── Form1.cs                  # Kezdő / login form logika
├── Form1.Designer.cs         # UI definíció (auto-generált)
├── Form1.resx                # Form erőforrásai
│
├── MainForm.cs               # Fő alkalmazás ablak
│
├── DashboardForm.cs          # Dashboard nézet
├── DashboardForm.Designer.cs
├── DashboardForm.resx
│
├── UserBoards.cs             # Felhasználói boardok kezelése
├── UserBoards.Designer.cs
├── UserBoards.resx
│
├── UserDocs.cs               # Dokumentumok kezelése
│
├── UserSessions.cs           # Session kezelés
├── UserSessions.Designer.cs
├── UserSessions.resx
│
├── BoardData.cs              # Board adatszerkezet
├── SessionData.cs            # Session adatszerkezet
│
├── LoginRequest.cs           # Bejelentkezési kérés modell
├── LoginResponse.cs          # Bejelentkezési válasz modell
│
├── HashPassword.cs           # Jelszó hash-elés
│
├── Evinote.csproj            # Projekt fájl

---

### 📞 Készítők
- Drávucz Patrik
- Lados Dávid
- Notheisz Domonkos Mátyás
