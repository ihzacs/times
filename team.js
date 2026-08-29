const API = "https://www.thesportsdb.com/api/v1/json/123";

async function getJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("erro " + res.status);
  return res.json();
}

function formatDate(dateStr, timeStr){
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  let hora = '';
  if(timeStr){
    hora = ' · ' + timeStr.slice(0,5);
  }
  return `${d}/${m}${hora}`;
}

function renderPastMatch(ev){
  const home = ev.strHomeTeam;
  const away = ev.strAwayTeam;
  const hs = ev.intHomeScore;
  const as = ev.intAwayScore;
  return `<div class="match">
    <span class="names">${home} <em>vs</em> ${away}</span>
    <span class="score">${hs ?? '-'} : ${as ?? '-'}</span>
  </div>`;
}

function renderNextMatch(ev){
  const home = ev.strHomeTeam;
  const away = ev.strAwayTeam;
  return `<div class="match">
    <span class="names">${home} <em>vs</em> ${away}</span>
    <span class="date">${formatDate(ev.dateEvent, ev.strTime)}</span>
  </div>`;
}

async function loadTeam(teamName){
  try{
    const search = await getJSON(`${API}/searchteams.php?t=${encodeURIComponent(teamName)}`);
    const team = search.teams && search.teams[0];
    if(!team){
      document.getElementById('last').innerHTML = '<div class="err">time não encontrado</div>';
      return;
    }
    if(team.strTeamBadge){
      document.getElementById('logo').src = team.strTeamBadge;
    }
    const teamId = team.idTeam;
    const leagueName = team.strLeague;

    // últimos jogos
    try{
      const last = await getJSON(`${API}/eventslast.php?id=${teamId}`);
      const events = last.results || [];
      document.getElementById('last').innerHTML =
        events.slice(0,6).map(renderPastMatch).join('') || '<div class="err">sem dados</div>';
    }catch(e){
      document.getElementById('last').innerHTML = `<div class="err">não carregou (${e.message})</div>`;
    }

    // próximos jogos
    try{
      const next = await getJSON(`${API}/eventsnext.php?id=${teamId}`);
      const events = next.events || [];
      document.getElementById('next').innerHTML =
        events.slice(0,6).map(renderNextMatch).join('') || '<div class="err">sem jogos agendados</div>';
    }catch(e){
      document.getElementById('next').innerHTML = `<div class="err">não carregou (${e.message})</div>`;
    }

    // tabela / posição
    try{
      const leagueSearch = await getJSON(`${API}/search_all_leagues.php?c=${encodeURIComponent(team.strCountry || '')}`);
    }catch(e){ /* ignorar, tabela é opcional */ }

    try{
      const leagueId = team.idLeague;
      const seasonGuess = new Date().getMonth() >= 6
        ? `${new Date().getFullYear()}-${new Date().getFullYear()+1}`
        : `${new Date().getFullYear()-1}-${new Date().getFullYear()}`;
      let table = await getJSON(`${API}/lookuptable.php?l=${leagueId}&s=${seasonGuess}`);
      if(!table.table){
        // tenta temporada em ano único (ligas como Brasileirão)
        table = await getJSON(`${API}/lookuptable.php?l=${leagueId}&s=${new Date().getFullYear()}`);
      }
      const row = table.table && table.table.find(r => r.idTeam === teamId);
      if(row){
        document.getElementById('pos').innerHTML = `${row.intRank}º`;
        document.getElementById('pts').innerHTML = `${row.intPoints} pts · ${row.intWin}V ${row.intDraw}E ${row.intLoss}D`;
      } else {
        document.getElementById('pos').innerHTML = 'n/d';
        document.getElementById('pts').innerHTML = leagueName || '';
      }
    }catch(e){
      document.getElementById('pos').innerHTML = 'n/d';
    }

  }catch(e){
    document.getElementById('last').innerHTML = `<div class="err">erro geral: ${e.message}</div>`;
  }
}
