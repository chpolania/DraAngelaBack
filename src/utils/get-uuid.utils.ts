import { v4 as uuid } from 'uuid';

import { ICustomRequest } from '../domain/interfaces/index.interface';

export function getRequestUUID(req: ICustomRequest): string {
    let UUID: string = '';
    if (req.header('X-RqUID') !== '') {
        UUID = req.header('X-RqUID') as string;
    } else {
        UUID = uuid();
    }
    return UUID;
}
