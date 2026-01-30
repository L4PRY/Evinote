<script>
  import backgroundImage from '$lib/assets/evi_bg.png';
  const team = [
    {
      name: "Mátyás",
      role: "Backend / Projektgazda",
      avatar: "https://github.com/slopslug.png",
      githubUsername: "slopslug"
    },
    {
      name: "Dávid",
      role: "Frontend fejlesztő",
      avatar: "https://github.com/davidlados511.png",
      githubUsername: "davidlados511"
    },
    {
        name: "Patrik",
        role: "Frontend/Backend fejlesztő",
        avatar: "https://github.com/L4PRY.png",
        githubUsername: "L4PRY"
    }
  ];
</script>

<div class="background" style="background-image: url({backgroundImage});">
</div>

<section class="about-wrapper">
  <div class="about-content">
    <h1>Meet Our Team</h1>

    <p class="about-text">
      Az <strong>Evinote</strong> egy jegyzetelésre szolgáló webalkalmazás,
      amelynek célja az egyszerű, átlátható és gyors jegyzetkezelés.
      A projekt tanulási célból készül, modern webes technológiák
      felhasználásával.
      <br /><br />
      Kis csapatként dolgozunk rajta, fókuszban a letisztult felhasználói
      élménnyel és a jól strukturált frontend megoldásokkal.
    </p>

    <div class="team-card">
      {#each team as member}
        <div class="member">
          <img src={member.avatar} alt={member.name} />
          <h3>{member.name}</h3>
          <span>{member.role}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
.background {
    position: fixed; /* Fixen a háttérben marad */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1; /* Behelyezi a tartalom mögé */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

  .about-wrapper {
    min-height: calc(100vh - 80px);
    display: flex;
    padding: 5rem;
    width: 75%;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    border-radius: 20px;
    background: #333333;
  }

  .about-content {
    max-width: 1000px;
    text-align: center;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 1.5rem;
    color: #f5f5f5;
  }

  .about-text {
    max-width: 700px;
    margin: 0 auto 3rem auto;
    font-size: 1.05rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.75);
  }

  .team-card {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  .member {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .member img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: #111;
  }

  .member h3 {
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
    color: #fff;
  }

  .member span {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
