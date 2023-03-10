import './EventToast.css';
import Icon from './AnnouncementIcon';
import { MdOutlineClose } from 'react-icons/md';
import { Toast } from 'react-hot-toast';

interface IProps {
  event: any;
  id: string;
  onClick: () => void;
  t: Toast;
}

export default function EventToast({ event, id, onClick, t }: IProps) {
  return (
    <div className={`single-toast ${t.visible ? 'zoomIn' : 'zoomOut'}`} key={id}>
      <header>
        <div className="toast-title">
          <Icon className="announcement-icon" />
          <p>{event.title}</p>
        </div>
        <MdOutlineClose onClick={onClick} className="cross-icon" color="white" />
      </header>
      <p className="toast-body">{event.bodyText}</p>
      <div className="toast-links">
        {event.buttons.map((button: any) => {
          if (button.newTab) {
            return (
              <a key={event.id + button.text} target="_blank" rel="noreferrer noopener" href={button.link}>
                {button.text}
              </a>
            );
          } else {
            return (
              <a key={event.id + button.text} href={button.link}>
                {button.text}
              </a>
            );
          }
        })}
      </div>
    </div>
  );
}
