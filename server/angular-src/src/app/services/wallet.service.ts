import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  user : any;
  constructor(private http : HttpClient) { }

  async login (user) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    let res = await this.http.post<any>("http://localhost:5000/users/login", user, {headers : headers}).toPromise();
    if (res.success) {
      console.log(JSON.stringify(res.clientWalletAccount))
      localStorage.setItem('user', JSON.stringify(res.clientWalletAccount));
    }

    return res;
  }

  register (data) {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>('http://localhost:5000/users/register', data, {headers : headers});
  }

  getUserData () {
    return JSON.parse(localStorage.getItem('user'));
  }

  async getAccountBalance () {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    console.log(localStorage)
    let email = {
      "email" : (JSON.parse(localStorage.getItem('user'))).email
    };
    let res = await this.http.post<any>('http://localhost:5000/token-wallet/accountBalance', email, {headers : headers}).toPromise();
    
    if(res.success) {
      return res.balance;
    }
    else { 
      return 0;
    }
  }
  
  deposit (depositData) {
    console.log(depositData)
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>('http://localhost:5000/token-wallet/deposit', depositData, {headers : headers});    
  }

  transfer (transferData) {
    console.log(transferData);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>('http://localhost:5000/token-wallet/transfer', transferData, {headers : headers});
  }

  withdraw (withdrawData) {
    console.log(withdrawData)
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<any>('http://localhost:5000/token-wallet/withdraw', withdrawData, {headers : headers});    
  }
}
