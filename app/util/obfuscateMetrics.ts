import http from 'http';
import {RequestResponseRecord} from 'swagger-stats';

/**
 * Modifies the `RequestResponseRecord`, which is used to store metrics,
 * to obfuscate credentials and other sensitive data of the user.
 * @param req - The incoming request
 * @param res - The outgoing response
 * @param rrr - The record
 */
export function obfuscateMetrics(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    rrr: RequestResponseRecord,
): void {
  if (req.url) {
    if (req.url === '/auth/login' || req.url === '/auth/sign-up') {
      if (rrr.http.request.headers) {
        rrr.http.request.headers['xsfr-token'] = '******';
      }

      if (rrr.http.request.body && rrr.http.request.body.password) {
        rrr.http.request.body.password = '******';
      }
    }
  }
}
