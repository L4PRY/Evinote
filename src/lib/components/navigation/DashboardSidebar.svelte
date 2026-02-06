<script lang="ts">
    import DashboardButton from "./DashboardButton.svelte";
</script>

<aside>
    <h2>Dashboard Sidebar</h2>
    <nav>
        <ul>
            <li><DashboardButton>Overview</DashboardButton></li>
        </ul>
    </nav>
</aside>

<style>
    aside {
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
    }
</style>