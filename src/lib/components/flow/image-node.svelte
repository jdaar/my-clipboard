<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import type { Writable } from 'svelte/store';
 
  type $$Props = NodeProps;
 
  export let data: { 
    title: Writable<string>,
    source: Writable<string>,
    dimensions: Writable<{ width: number, height: number }>
  };
 
  const { title, source } = data;
</script>
 
<section class="img-node">
  <Handle type="target" position={Position.Left} />
  <header>
    <div></div>
    <input type="text" bind:value={$title} />
    <aside>
      <button>
        <svg width="8" height="9" viewBox="0 0 8 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.66667 9C6.2963 9 5.98148 8.86875 5.72222 8.60625C5.46296 8.34375 5.33333 8.025 5.33333 7.65C5.33333 7.5975 5.33704 7.54305 5.34444 7.48665C5.35185 7.43025 5.36296 7.3797 5.37778 7.335L2.24444 5.49C2.11852 5.6025 1.97778 5.6907 1.82222 5.7546C1.66667 5.8185 1.5037 5.8503 1.33333 5.85C0.962963 5.85 0.648148 5.71875 0.388889 5.45625C0.12963 5.19375 0 4.875 0 4.5C0 4.125 0.12963 3.80625 0.388889 3.54375C0.648148 3.28125 0.962963 3.15 1.33333 3.15C1.5037 3.15 1.66667 3.18195 1.82222 3.24585C1.97778 3.30975 2.11852 3.3978 2.24444 3.51L5.37778 1.665C5.36296 1.62 5.35185 1.56945 5.34444 1.51335C5.33704 1.45725 5.33333 1.4028 5.33333 1.35C5.33333 0.975 5.46296 0.65625 5.72222 0.39375C5.98148 0.13125 6.2963 0 6.66667 0C7.03704 0 7.35185 0.13125 7.61111 0.39375C7.87037 0.65625 8 0.975 8 1.35C8 1.725 7.87037 2.04375 7.61111 2.30625C7.35185 2.56875 7.03704 2.7 6.66667 2.7C6.4963 2.7 6.33333 2.6682 6.17778 2.6046C6.02222 2.541 5.88148 2.4528 5.75556 2.34L2.62222 4.185C2.63704 4.23 2.64815 4.2807 2.65556 4.3371C2.66296 4.3935 2.66667 4.4478 2.66667 4.5C2.66667 4.5525 2.66296 4.60695 2.65556 4.66335C2.64815 4.71975 2.63704 4.7703 2.62222 4.815L5.75556 6.66C5.88148 6.5475 6.02222 6.45945 6.17778 6.39585C6.33333 6.33225 6.4963 6.3003 6.66667 6.3C7.03704 6.3 7.35185 6.43125 7.61111 6.69375C7.87037 6.95625 8 7.275 8 7.65C8 8.025 7.87037 8.34375 7.61111 8.60625C7.35185 8.86875 7.03704 9 6.66667 9Z" fill="#886D4F"/>
        </svg> 
      </button>
      <button>
        <svg width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 0.5H4.5L4.07143 0H1.92857L1.5 0.5H0V1.5H6M0.428571 8C0.428571 8.26522 0.518877 8.51957 0.679623 8.70711C0.840368 8.89464 1.05839 9 1.28571 9H4.71429C4.94161 9 5.15963 8.89464 5.32038 8.70711C5.48112 8.51957 5.57143 8.26522 5.57143 8V2H0.428571V8Z" fill="#886D4F"/>
        </svg>
      </button>
    </aside>
    <div></div>
  </header>
  <div/>
  <footer>
    <img alt={$title} src={$source}>
  </footer>
  <div/>
  <Handle type="source" position={Position.Right} on:connect on:connectstart on:connectend />
</section>

<style>
  div {
    display: block;
    height: 10px;
    width: 10px;
  }
  header {
    width: 100%;
    padding-top: 5px;
    padding-bottom: 5px;
    background-color: var(--bg-sec-color);
    display: flex;
    align-items: center;
    border-radius: var(--border-radius) var(--border-radius) 0px 0px;
    border-bottom: 1px solid var(--border-sec-color);
    background: linear-gradient(0deg, rgba(133, 110, 84, 0.20) 0.3%, rgba(133, 110, 84, 0.00) 60.73%), var(--bg-sec-color, #130800);
    box-shadow: 0px 4px 10px 0px #130800;
  }

  header > input {
    border: none;
    outline: none;
    background: none;
    width: 90%;
    font-weight: 700;
  }

  header > aside {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  button {
    border-radius: var(--border-radius);
    color: var(--text-color);
    max-width: 30px;
    max-height: 30px;
    min-width: 20px;
    min-height: 20px;
    border: 1px solid var(--border-sec-color);
    background: linear-gradient(180deg, rgba(133, 110, 84, 0.00) 47.06%, rgba(133, 110, 84, 0.20) 97.06%), var(--bg-sec-color, #130800);
  }

  section  {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    border-radius: var(--border-radius);
    background-color: var(--bg-color);
    width: 100%;
    min-height: 100%;
    resize: both;
  }
</style>