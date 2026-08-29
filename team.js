const API = "https://api.sofascore.com/api/v1";

async function getJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("erro " + res.status);
  return res.json();
}

function formatDate(ts){
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) + ' · ' +
         d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

function renderMatch(ev){
  const home = ev.homeTeam.shortName || ev.homeTeam.name;
  const away = ev.awayTeam.shortName || ev.awayTeam.name;
  let right = '';
  if(ev.status && ev.status.type === 'finished'){
    right = `<span class="score">${ev.homeScore.current ?? '-'} : ${ev.awayScore.current ?? '-'}</span>`;
  } else {
    right = `<span class="date">${formatDate(ev.startTimestamp)}</span>`;
  }
  return `<div class="match">
    <span class="names">${home} <em>vs</em> ${away}</span>
    ${right}
  </div>`;
}

async function loadTeam(id){
  document.getElementById(`logo`).src = `${API}/team/${id}/image`;

  try{
    const last = await getJSON(`${API}/team/${id}/events/last/0`);
    document.getElementById('last').innerHTML =
      last.events.slice(0,6).map(renderMatch).join('') || '<div class="err">sem dados</div>';
  }catch(e){
    document.getElementById('last').innerHTML = `<div class="err">não carregou (${e.message})</div>`;
  }

  try{
    const next = await getJSON(`${API}/team/${id}/events/next/0`);
    document.getElementById('next').innerHTML =
      next.events.slice(0,6).map(renderMatch).join('') || '<div class="err">sem jogos agendados</div>';
  }catch(e){
    document.getElementById('next').innerHTML = `<div class="err">não carregou (${e.message})</div>`;
  }

  try{
    const last = await getJSON(`${API}/team/${id}/events/last/0`);
    const ev = last.events[0];
    if(ev){
      const tId = ev.tournament.uniqueTournament.id;
      const seasons = await getJSON(`${API}/unique-tournament/${tId}/seasons`);
      const seasonId = seasons.seasons[0].id;
      const standings = await getJSON(`${API}/unique-tournament/${tId}/season/${seasonId}/standings/total`);
      const row = standings.standings[0].rows.find(r => r.team.id === id);
      if(row){
        document.getElementById('pos').innerHTML = `${row.position}º`;
        document.getElementById('pts').innerHTML = `${row.points} pts · ${row.wins}V ${row.draws}E ${row.losses}D`;
      }
    }
  }catch(e){
    document.getElementById('pos').innerHTML = 'n/d';
  }
}
