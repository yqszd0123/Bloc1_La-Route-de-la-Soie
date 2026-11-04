(function initAssemblyPriority(global) {
  'use strict';

  const core = global.AvelisCore = global.AvelisCore || {};
  const SOURCE_ID = 'FRAMECAD_ASSEMBLY_PRIORITY_2025';

  function byPosition(a, b) {
    return a.position.xMm - b.position.xMm
      || a.position.zMm - b.position.zMm
      || a.id.localeCompare(b.id);
  }

  function timberSequence(candidate) {
    const groups = ['bottom_plate', 'boundary_stud', 'king_stud', 'jack_stud', 'header', 'sill', 'common_stud', 'cripple_stud', 'top_plate'];
    return candidate.members.slice().sort((a, b) => groups.indexOf(a.role) - groups.indexOf(b.role) || byPosition(a, b))
      .map((member, i) => ({
        order: i + 1, memberId: member.id, role: member.role, label: member.label, openingId: member.openingId,
        group: 'TIMBER_' + member.role.toUpperCase(),
        frameType: candidate.wall.openings.length ? 'WALL_WITH_OPENINGS' : 'SOLID_WALL', sourceId: 'TIMBER_POC_ASSEMBLY'
      }));
  }

  function sequence(candidate) {
    if (candidate.frameMaterial === 'TIMBER') return timberSequence(candidate);
    const members = candidate && Array.isArray(candidate.members) ? candidate.members : [];
    const openings = candidate && candidate.wall && Array.isArray(candidate.wall.openings)
      ? candidate.wall.openings.slice().sort((a, b) => a.xMm - b.xMm || a.id.localeCompare(b.id))
      : [];
    const assigned = new Set();
    const ordered = [];
    const frameType = openings.length ? 'WALL_WITH_OPENINGS' : 'SOLID_WALL';

    function append(member, group) {
      if (!member || assigned.has(member.id)) return;
      assigned.add(member.id);
      ordered.push({
        order: ordered.length + 1,
        memberId: member.id,
        role: member.role,
        label: member.label,
        openingId: member.openingId,
        group,
        frameType,
        sourceId: SOURCE_ID
      });
    }

    function appendWhere(predicate, group, comparator) {
      members.filter((member) => !assigned.has(member.id) && predicate(member))
        .sort(comparator || byPosition)
        .forEach((member) => append(member, group));
    }

    const boundaryStuds = members.filter((member) => member.role === 'boundary_stud').sort(byPosition);
    appendWhere((member) => member.role === 'top_track', 'TOP_PLATE');
    append(boundaryStuds[0], 'LEFT_STUD');

    if (!openings.length) {
      append(boundaryStuds[boundaryStuds.length - 1], 'RIGHT_STUD');
      appendWhere((member) => ['noggin', 'blocking'].includes(member.role), 'NOGGIN_BLOCKING');
      appendWhere((member) => ['common_stud', 'cripple_stud', 'bracing'].includes(member.role), 'CENTER_STUDS_AND_BRACING');
    } else {
      openings.forEach((opening, openingIndex) => {
        const jambs = members.filter((member) => (
          !assigned.has(member.id)
          && member.role === 'opening_jamb'
          && member.openingId === opening.id
        )).sort(byPosition);
        append(jambs[0], `OPENING_${openingIndex + 1}_LEFT_TRIM_STUD`);
        appendWhere((member) => (
          ['noggin', 'blocking'].includes(member.role) && member.openingId === opening.id
        ), `OPENING_${openingIndex + 1}_FIRST_NOG`);
        appendWhere((member) => (
          member.role === 'cripple_stud' && member.openingId === opening.id
        ), `OPENING_${openingIndex + 1}_CENTER_STUDS`);
        append(jambs[jambs.length - 1], `OPENING_${openingIndex + 1}_RIGHT_TRIM_STUD`);
        appendWhere((member) => member.role === 'opening_header' && member.openingId === opening.id, `OPENING_${openingIndex + 1}_HEADER`);
        appendWhere((member) => member.role === 'window_sill' && member.openingId === opening.id, `OPENING_${openingIndex + 1}_SILL`);
      });
      append(boundaryStuds[boundaryStuds.length - 1], 'RIGHT_STUD');
      appendWhere((member) => ['noggin', 'blocking'].includes(member.role), 'SECOND_NOG_BLOCKING');
      appendWhere((member) => ['common_stud', 'cripple_stud', 'bracing'].includes(member.role), 'CENTER_STUDS_AND_BRACING');
    }

    appendWhere((member) => member.role !== 'bottom_track', 'UNCLASSIFIED_BEFORE_BOTTOM_PLATE');
    appendWhere((member) => member.role === 'bottom_track', 'BOTTOM_PLATE');
    return ordered;
  }

  function orderedMembers(candidate) {
    const byId = new Map(candidate.members.map((member) => [member.id, member]));
    return sequence(candidate).map((entry) => Object.assign({}, byId.get(entry.memberId), {
      assemblyOrder: entry.order,
      assemblyGroup: entry.group,
      assemblyFrameType: entry.frameType,
      assemblySourceId: entry.sourceId
    }));
  }

  function validate(candidate) {
    const entries = sequence(candidate);
    return {
      continuous: entries.every((entry, index) => entry.order === index + 1),
      unique: new Set(entries.map((entry) => entry.memberId)).size === entries.length,
      complete: entries.length === candidate.members.length,
      sourceId: candidate.frameMaterial === 'TIMBER' ? 'TIMBER_POC_ASSEMBLY' : SOURCE_ID,
      frameType: entries[0] ? entries[0].frameType : (candidate.wall.openings.length ? 'WALL_WITH_OPENINGS' : 'SOLID_WALL')
    };
  }

  core.assemblyPriority = { SOURCE_ID, sequence, orderedMembers, validate };
})(typeof globalThis !== 'undefined' ? globalThis : window);
