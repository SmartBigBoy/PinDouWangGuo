/**
 * projects.js — 拼豆王国 我的作品页
 * 列出 / 加载 / 导出 / 导入 / 重命名 / 删除 本地历史作品
 */
document.addEventListener('DOMContentLoaded', function () {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('projectsEmpty');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    PDStorage.listProjects().then(function (list) {
      if (!list || !list.length) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
      }
      empty.style.display = 'none';
      grid.innerHTML = list.map(function (p) {
        const date = new Date(p.updatedAt || Date.now()).toLocaleDateString('zh-CN');
        const src = p.source === 'editor' ? '手绘' : '生成器';
        const img = p.thumbnail ? '<img src="' + p.thumbnail + '" alt="">' : '<span style="font-size:2rem">🎨</span>';
        return '<div class="project-card" data-id="' + esc(p.id) + '" data-source="' + esc(p.source) + '">'
          + '<div class="project-thumb">' + img + '</div>'
          + '<div class="project-info">'
          + '<div class="project-name" title="' + esc(p.name) + '">' + esc(p.name) + '</div>'
          + '<div class="project-meta">' + src + ' · ' + p.width + '×' + p.height + ' · ' + esc(p.palette) + ' · ' + date + '</div>'
          + '</div>'
          + '<div class="project-actions">'
          + '<button class="act-load" data-act="load">加载</button>'
          + '<button data-act="export">导出</button>'
          + '<button data-act="rename">重命名</button>'
          + '<button class="act-del" data-act="delete">删除</button>'
          + '</div>'
          + '</div>';
      }).join('');
      bind();
    }).catch(function () { showToast('读取失败'); });
  }

  function bind() {
    grid.querySelectorAll('.project-card').forEach(function (card) {
      const id = card.getAttribute('data-id');
      const source = card.getAttribute('data-source');
      card.querySelector('[data-act="load"]').addEventListener('click', function () {
        const url = (source === 'editor' ? 'create.html' : 'index.html') + '?project=' + encodeURIComponent(id) + (source === 'editor' ? '' : '#generator');
        location.href = url;
      });
      card.querySelector('[data-act="export"]').addEventListener('click', function () {
        PDStorage.exportProject(id).then(function () { showToast('已导出 JSON 文件'); }).catch(function () { showToast('导出失败'); });
      });
      card.querySelector('[data-act="rename"]').addEventListener('click', function () {
        const cur = card.querySelector('.project-name').textContent;
        const name = prompt('请输入新名称：', cur);
        if (name == null) return;
        PDStorage.renameProject(id, name).then(function () { render(); });
      });
      card.querySelector('[data-act="delete"]').addEventListener('click', function () {
        if (!confirm('确定删除该作品？删除后无法恢复，建议先导出备份。')) return;
        PDStorage.deleteProject(id).then(function () { showToast('已删除'); render(); });
      });
    });
  }

  importBtn.addEventListener('click', function () { importFile.click(); });
  importFile.addEventListener('change', function () {
    if (!importFile.files || !importFile.files[0]) return;
    PDStorage.importProject(importFile.files[0]).then(function () {
      showToast('已导入');
      render();
      importFile.value = '';
    }).catch(function (e) {
      showToast(e && e.message ? e.message : '导入失败');
      importFile.value = '';
    });
  });

  render();
});
