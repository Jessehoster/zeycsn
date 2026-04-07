const copyButton = document.getElementById("copyWorldButton");
const copyMessage = document.getElementById("copyMessage");
const gtServerStatus = document.getElementById("gtServerStatus");
const gtPlayers = document.getElementById("gtPlayers");
const statusUpdated = document.getElementById("statusUpdated");

if (copyButton && copyMessage) {
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("TEAMZEY92");
      copyMessage.textContent = "World name copied.";
    } catch (error) {
      copyMessage.textContent = "Could not copy. Please copy manually: TEAMZEY92";
    }
  });
}

function setStatus(serverText, playersText, isUp) {
  if (!gtServerStatus || !gtPlayers || !statusUpdated) return;

  gtServerStatus.innerHTML = `<span class="dot"></span>${serverText}`;
  gtPlayers.textContent = playersText;

  const dot = gtServerStatus.querySelector(".dot");
  if (dot) {
    dot.style.background = isUp ? "#22c55e" : "#ef4444";
    dot.style.boxShadow = isUp
      ? "0 0 7px rgba(34, 197, 94, 0.85)"
      : "0 0 7px rgba(239, 68, 68, 0.85)";
  }

  statusUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

async function updateGrowtopiaStatus() {
  async function getStatusFromDetailProxies() {
    const detailUrl = "https://www.growtopiagame.com/detail";
    const sources = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(detailUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(detailUrl)}`,
      `https://r.jina.ai/http://www.growtopiagame.com/detail`,
    ];

    for (const source of sources) {
      try {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) continue;
        const text = await response.text();
        const cleaned = text.trim();
        const jsonText = cleaned.startsWith("{")
          ? cleaned
          : cleaned.slice(cleaned.indexOf("{"));
        const payload = JSON.parse(jsonText);
        const rawPlayers = String(payload?.online_user ?? payload?.online ?? "").replace(/[^0-9]/g, "");
        if (!rawPlayers) continue;
        return {
          isUp: Number(rawPlayers) > 0,
          players: rawPlayers,
        };
      } catch (error) {
        // Try next source.
      }
    }
    return null;
  }

  try {
    const response = await fetch("/api/growtopia-status", { cache: "no-store" });
    if (!response.ok) throw new Error("status fetch failed");

    const data = await response.json();
    let players = data?.players ?? "--";
    let isUp = Boolean(data?.isUp);

    if (players === "--" || !players) {
      const fallback = await getStatusFromDetailProxies();
      if (fallback) {
        players = fallback.players;
        isUp = fallback.isUp;
      }
    }

    const serverText = isUp ? "Server is up" : "Server status unavailable";
    const playersText = `Players online: ${players}`;
    setStatus(serverText, playersText, isUp);
  } catch (error) {
    const isFileMode = window.location.protocol === "file:";
    if (isFileMode) {
      setStatus("Run server.py first", "Players online: --", false);
    } else {
      setStatus("Server status unavailable", "Players online: --", false);
    }
  }
}

updateGrowtopiaStatus();
setInterval(updateGrowtopiaStatus, 60000);
