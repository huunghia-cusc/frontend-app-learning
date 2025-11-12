import React from 'react';
import { useSelector } from 'react-redux';
import { sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';

import messages from './messages';
// ❌ Bỏ Timeline cũ
// import Timeline from './timeline/Timeline';

import { fetchDatesTab } from '../data';
import { useModel } from '../../generic/model-store';

import SuggestedScheduleHeader from '../suggested-schedule-messaging/SuggestedScheduleHeader';
import ShiftDatesAlert from '../suggested-schedule-messaging/ShiftDatesAlert';
import UpgradeToCompleteAlert from '../suggested-schedule-messaging/UpgradeToCompleteAlert';
import UpgradeToShiftDatesAlert from '../suggested-schedule-messaging/UpgradeToShiftDatesAlert';

import './Dates-Tab.scss'; // ✅ style mới (card + list)

function formatLongDate(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toDateString();
  }
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

const DatesTab = () => {
  const intl = useIntl();
  const { courseId } = useSelector(state => state.courseHome);

  const { isSelfPaced, org } = useModel('courseHomeMeta', courseId);
  const { courseDateBlocks = [] } = useModel('dates', courseId);

  const hasDeadlines = courseDateBlocks && courseDateBlocks.some(x => x.dateType === 'assignment-due-date');

  const logUpgradeLinkClick = () => {
    sendTrackEvent('edx.bi.ecommerce.upsell_links_clicked', {
      org_key: org,
      courserun_key: courseId,
      linkCategory: 'personalized_learner_schedules',
      linkName: 'dates_upgrade',
      linkType: 'button',
      pageName: 'dates_tab',
    });
  };

  const today = new Date();

  return (
    <>
      <div role="heading" aria-level="1" className="h2 my-3">
        {intl.formatMessage(messages.title)}
      </div>

      {isSelfPaced && hasDeadlines && (
        <>
          <ShiftDatesAlert model="dates" fetch={fetchDatesTab} />
          <SuggestedScheduleHeader />
          <UpgradeToCompleteAlert logUpgradeLinkClick={logUpgradeLinkClick} />
          <UpgradeToShiftDatesAlert logUpgradeLinkClick={logUpgradeLinkClick} model="dates" />
        </>
      )}

      {/* ==== Card bo góc chứa danh sách ngày (UI như Figma) ==== */}
      <div className="figma-card dates-card">
        {courseDateBlocks.length === 0 ? (
          <div className="dates-empty">No dates to show.</div>
        ) : (
          <ul className="dates-list">
            {courseDateBlocks.map((b, idx) => {
              // cố gắng lấy ngày & tiêu đề từ dữ liệu có sẵn
              const raw = b.date || b.dateString || b.dateValue;
              const dt = raw ? new Date(raw) : new Date();
              const title =
                b.linkText ||
                b.title ||
                b.assignmentType ||
                b.description ||
                '';

              const sub =
                b.description ||
                (b.dateType === 'course-start-date'
                  ? 'Course starts'
                  : b.dateType === 'course-end-date'
                  ? 'Course ends'
                  : '');

              const todayFlag = b.isToday || isSameDay(dt, today);

              return (
                <li className="dates-item" key={`${dt?.toISOString?.() || idx}-${idx}`}>
                  <span className={`dot ${todayFlag ? 'dot--today' : ''}`} />
                  <div className="item-body">
                    <div className="item-row">
                      <span className="item-date">{formatLongDate(dt)}</span>
                      {todayFlag && <span className="pill-today">TODAY</span>}
                    </div>
                    {title && <div className="item-title">{title}</div>}
                    {sub && <div className="item-sub">{sub}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default DatesTab;
