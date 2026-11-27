/* ============ EVENTOS ============ */
function bindEventos(){
  const bBuscar=$('barraBuscar'); if(bBuscar) bBuscar.onclick=()=>{ vibrar(); abrirModal('modalBusca'); initBusca(); };
  const bFav=$('barraFavoritos'); if(bFav) bFav.onclick=()=>{ vibrar(); abrirFavoritas(); };
  const bGen=$('barraGeneros'); if(bGen) bGen.onclick=()=>{ vibrar(); renderizarGeneros(); abrirModal('modalGeneros'); };
  const bYtm=$('barraYTMusic'); if(bYtm) bYtm.onclick=()=>{ vibrar(); window.open('https://music.youtube.com','_blank'); };
  const bFila=$('barraFila'); if(bFila) bFila.onclick=()=>{ vibrar(); abrirFila(); };
  const fabMain=$('fabMain'); if(fabMain) fabMain.onclick=()=>{ vibrar(); const m=$('fabMenu'); if(m) m.classList.toggle('open'); fabMain.classList.toggle('open'); };

  const tp=$('topPlayBtn'); if(tp) tp.onclick=()=>togglePlay();
  const tn=$('topNextBtn'); if(tn) tn.onclick=()=>next();
  const tv=$('topPrevBtn'); if(tv) tv.onclick=()=>prev();

  const bfv=$('btnFavVDB'); if(bfv) bfv.onclick=()=>{ const m=appState.musicaAtual; if(m) toggleFav(m); };
  const ffc=$('filaFecharBtn'); if(ffc) ffc.onclick=()=>fecharFila();
  const fc=$('fecharGeneros'); if(fc) fc.onclick=()=>fecharModal('modalGeneros');
  const ff=$('fecharFavoritas'); if(ff) ff.onclick=()=>fecharModal('modalFavoritas');
  const fm=$('fecharMeuId'); if(fm) fm.onclick=()=>fecharModal('modalMeuId');
  const bc=$('fecharBusca'); if(bc) bc.onclick=()=>fecharModal('modalBusca');

  const lib=$('btnLiberar'); if(lib) lib.onclick=()=>tentarLiberarSenha();
  const cpId=$('btnCopiarIdBloqueio'); if(cpId) cpId.onclick=()=>copiarTexto(appState.fingerprint,'🆔 ID copiado');
  const wId=$('btnEnviarIdWhats'); if(wId) wId.onclick=()=>window.open('https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent('Meu ID VDB: '+appState.fingerprint),'_blank');
  const cpMeu=$('btnCopiarMeuId'); if(cpMeu) cpMeu.onclick=()=>copiarTexto(appState.fingerprint,'🆔 ID copiado');
  const wMeu=$('btnEnviarMeuIdWhats'); if(wMeu) wMeu.onclick=()=>window.open('https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent('Meu ID VDB: '+appState.fingerprint),'_blank');

  const fmix=$('fabMix'); if(fmix) fmix.onclick=()=>{ vibrar(); misturaVDB(); };
  const fsite=$('fabSite'); if(fsite) fsite.onclick=()=>window.open(MIDIA_CONFIG.LINK_SITE,'_blank');
  const fytm=$('fabYTMusic'); if(fytm) fytm.onclick=()=>window.open('https://music.youtube.com','_blank');
  const fvoice=$('fabVoice'); if(fvoice) fvoice.onclick=()=>{ vibrar(); buscarPorVoz(); };
  const fmeu=$('fabMeuId'); if(fmeu) fmeu.onclick=()=>{ if($('meuIdValue')) $('meuIdValue').textContent=appState.fingerprint; abrirModal('modalMeuId'); };
  const flib=$('fabLiberar'); if(flib) flib.onclick=()=>{ const ov=$('blockOverlay'); if(ov) ov.classList.add('active'); };
  const fqr=$('fabQrCode'); if(fqr) fqr.onclick=()=>{ if($('qrCodeImage')) $('qrCodeImage').src='https://api.qrserver.com/v1/create-qr-code/?size=220x220&data='+encodeURIComponent(location.href); if($('qrCodeModal')) $('qrCodeModal').classList.add('active'); };
  const qrC=$('qrCloseBtn'); if(qrC) qrC.onclick=()=>{ if($('qrCodeModal')) $('qrCodeModal').classList.remove('active'); };
  const frec=$('fabRecarregar'); if(frec) frec.onclick=()=>location.reload();
  const ffull=$('fabFullscreen'); if(ffull) ffull.onclick=()=>{ vibrar(); forcarFullscreen(); };
  const fsl=$('fabSleep'); if(fsl) fsl.onclick=()=>{
    if(appState.sleepTimerId){ clearTimeout(appState.sleepTimerId); appState.sleepTimerId=null; notif('🌙 Cancelado'); }
    else { appState.sleepTimerId=setTimeout(()=>{ audio.pause(); notif('🌙 Pausado'); },30*60000); notif('🌙 Sleep 30min'); }
  };
  const ffb=$('fabFeedback'); if(ffb) ffb.onclick=()=>window.open('https://wa.me/'+CONFIG.WHATSAPP+'?text=Feedback','_blank');
  const finst=$('fabInstalar'); if(finst) finst.onclick=()=>{ if($('instrucoesInstalar')) $('instrucoesInstalar').classList.add('active'); };
  const fci=$('fecharInstrucoesBtn'); if(fci) fci.onclick=()=>{ if($('instrucoesInstalar')) $('instrucoesInstalar').classList.remove('active'); };

  const fupd=$('fabAtualizarMidia');
  if(fupd) fupd.onclick=async()=>{
    vibrar(); notif('🔄 Atualizando mídias...', 2000);
    try{
      cacheGenero.clear();
      localStorage.removeItem(CACHE_GEN_KEY);
      if('caches' in window){ const ks=await caches.keys(); for(const k of ks){ if(k.includes('vdb-offline')||k.includes('genero')) await caches.delete(k); } }
      notif('✅ Mídias atualizadas!', 2000);
      renderizarGeneros(true);
      if(appState.modoAtual){ const m=await buscarGenero(appState.modoAtual); if(m&&m.length){ appState.musicas=m; FilaInteligente.resetar(m,appState.modoAtual); } }
    }catch(e){ notif('❌ Falha',3000,true); }
  };

  const fupa=$('fabAtualizarApp');
  if(fupa) fupa.onclick=async()=>{
    vibrar(); notif('🪄 Atualizando app...', 2000);
    try{
      if('caches' in window){ const ks=await caches.keys(); await Promise.all(ks.map(k=>caches.delete(k))); }
      setTimeout(()=>{ const url=location.href.split('?')[0] + '?v=' + Date.now(); location.replace(url); }, 800);
    }catch(e){ location.reload(true); }
  };

  const ftemas=$('fabTemas'); if(ftemas) ftemas.onclick=()=>{ vibrar(); abrirSeletorTema(); };
  const fbai=$('fabBaixarAtual');
  if(fbai) fbai.onclick=()=>{ vibrar(); if(!appState.modoAtual){ notif('⚠️ Escolha um gênero'); return; } iniciarDownloadGenero(appState.modoAtual); };

  const fger=$('fabGerenciarOffline');
  if(fger) fger.onclick=async()=>{
    vibrar();
    const meta=getOfflineMeta(); const gs=Object.keys(meta);
    if(!gs.length){ notif('📥 Nada baixado'); return; }
    let txt='📥 OFFLINE\n\n';
    gs.forEach(g=>{ const i=meta[g]; txt+='• '+g+': '+i.baixadas+'/'+i.total+(i.completo?' ✅':' ⏳')+'\n'; });
    const ok=await vdbDialog({title:'🗑️ LIMPAR OFFLINE',msg:txt+'\n\nApagar tudo?',okText:'Apagar'});
    if(ok){ const c=await abrirCache(); if(c){ const ks=await c.keys(); for(const k of ks) await c.delete(k); } setOfflineMeta({}); notif('🗑️ Limpo!'); renderizarGeneros(true); }
  };

  const dlc=$('dlCancelar'); if(dlc) dlc.onclick=()=>{ downloadCancelado=true; notif('🛑 Cancelando...'); };

  /* ===== PLAYER E ÁUDIO INFINITO ===== */
  audio.addEventListener('timeupdate',()=>{
    const cur=$('currentTime'), tot=$('totalTime'), fill=$('progressFill'), ring=$('progressRingFill');
    const d=audio.duration||0, c=audio.currentTime||0;
    if(cur) cur.textContent=fmt(c); if(tot) tot.textContent=fmt(d);
    const pct=d?c/d:0;
    if(fill) fill.style.width=(pct*100)+'%';
    if(ring) ring.setAttribute('stroke-dasharray',(pct*400).toFixed(1)+' 400');
  });
  
  audio.addEventListener('ended',()=>next());
  
  audio.addEventListener('play',()=>{
    appState.isPlaying=true;
    const pb=$('playBtn'); if(pb) pb.innerHTML='<i class="fas fa-pause"></i>';
    const tp=$('topPlayBtn'); if(tp) tp.innerHTML='<i class="fas fa-pause"></i>';
  });
  
  audio.addEventListener('pause',()=>{
    appState.isPlaying=false;
    const pb=$('playBtn'); if(pb) pb.innerHTML='<i class="fas fa-play"></i>';
    const tp=$('topPlayBtn'); if(tp) tp.innerHTML='<i class="fas fa-play"></i>';
  });

  // 🔥 O SEGREDO PARA TOCAR INFINITAMENTE COM TELA BLOQUEADA/APAGADA
  audio.addEventListener('pause', () => {
    // Se o celular pausar sozinho enquanto a tela está desligada, a gente força ele a voltar
    if (document.hidden && appState.isPlaying) {
      setTimeout(() => { 
        if (appState.isPlaying && audio.paused) {
          audio.play().catch(()=>{
            // Se falhar, recarrega a música e tenta de novo
            const m = appState.musicaAtual;
            if(m) tocar();
          });
        }
      }, 1000);
    }
  });

  // Mantém o sistema acordado para não matar o áudio
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tela apagou/bloqueou: pede ao sistema pra não matar o app
      WakeLockManager.ativar();
    } else {
      // Tela acendeu: atualiza a interface
      atualizarCoracao();
      const tp=$('topPlayBtn'); if(tp) tp.innerHTML = appState.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }
  });
}
