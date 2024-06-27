import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { Injectable } from '@nestjs/common';
import ldap from 'ldapjs';

@Injectable()
export class LDAPService {
  constructor() {}

  private getLdapClient() {
    return ldap.createClient({
      url: config.auth.ldap.url,
      bindDN: config.auth.ldap.bindDN,
      bindCredentials: config.auth.ldap.bindCredentials,
    });
  }

  /**
   * Search user by username
   */
  public searchUser(queryCriteria: string, baseDn: string, username: string): Promise<ldap.SearchEntry[]> {
    const client = this.getLdapClient();
    return new Promise((resolve, reject) => {
      const filter = queryCriteria.replace(/\%s/g, username);
      client.on('error', (e) => {
        if (e) {
          reject(new Error('UNEXPECTED ERROR WHILE SEARCHING USER: ' + e.message));
        }
      });
      client.search(baseDn, { filter, scope: 'sub' }, (err, result) => {
        const users: ldap.SearchEntry[] = [];
        result.on('searchEntry', (entry) => {
          if (entry) {
            users.push(entry);
          }
        });
        result.on('error', (e) => {
          if (e) {
            reject(new Error('UNEXPECTED ERROR WHILE SEARCHING USER: ' + e.message));
          }
        });
        // 查询结束
        result.on('end', () => {
          if (users.length > 0) {
            resolve(users);
          } else {
            reject(new Error('User not found.'));
          }
        });
      });
    });
  }

  public async loginByLDAP(username: string, password: string) {
    const ldapSearchEntries = await this.searchUser(config.auth.ldap.queryCriteria, config.auth.ldap.baseDN, username);
    if (!ldapSearchEntries?.length) {
      throw new Error('User not found.');
    }
    if (ldapSearchEntries.length > 1) {
      throw new Error('More than one user found with the same username: ' + username);
    }
    const client = this.getLdapClient();
    const ldapUser = ldapSearchEntries[0];
    const userDn = ldapUser.json.objectName;
    const bindPromise = new Promise((resolve, reject) => {
      client.bind(userDn, password, (e) => {
        if (e) {
          logger.error('Ldap Authenticate User error: ', e);
          reject(new Error('Invalid username or password.'));
        } else {
          logger.info(`LDAP User ${username} authenticated successfully.`);
          resolve(true);
        }
      });
    });
    try {
      await bindPromise;
    } finally {
      client.unbind();
    }
    return ldapUser.json.attributes;
  }
}
