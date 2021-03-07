import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from './auth.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}

class Persons {
  id: number;
  FirstName: string;
  LastName: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  display = 'none';
  UserForm: FormGroup;

  loginForm: FormGroup;
  persons: Persons[];
  isLogin = false;

  @ViewChild(DataTableDirective, { static: false })
  datatableElement: DataTableDirective;
  dtTrigger: Subject<any> = new Subject();
  dtOptions: DataTables.Settings = {};
  backdrop: boolean = false;
  userId: any;
  isEdit: boolean = false;

  constructor(
    private http: HttpClient,
    private AuthService: AuthService,
    private chRef: ChangeDetectorRef,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.backdrop = false;
    this.isEdit = false;
    this.initForm();
    this.initUserForm();
    this.chRef.detectChanges();
    if (!localStorage.getItem('token')) {
      this.isLogin = false;
    } else {
      this.isLogin = true;
      this.initTables(localStorage.getItem('token'));
    }
  }

  ngAfterViewInit() {
    this.dtTrigger.next();
    if (this.datatableElement) {
      this.onKeySearch();
    }
  }

  onKeySearch() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.columns().every(function () {
        const that = this;
        $('.searchId', this.footer()).on('keyup change', function () {
          if (that.search() !== this['value']) {
            that.search(this['value']).draw();
          }
        });
      });
    });
  }

  openModal(person?) {
    if (person) {
      this.isEdit = true;
      this.userId = person.id;
      this.UserForm.patchValue({
        FirstName: person.firstName,
        LastName: person.lastName,
      });
    } else {
      this.isEdit = false;
    }
    this.display = 'block';
    this.backdrop = true;
  }
  onCloseHandled() {
    this.display = 'none';
    this.backdrop = false;
  }

  initForm(): void {
    this.loginForm = new FormGroup({
      UserName: new FormControl(null, Validators.required),
      Password: new FormControl(null, [
        Validators.required,
        Validators.minLength(5),
      ]),
    });
  }

  initUserForm(): void {
    this.UserForm = new FormGroup({
      FirstName: new FormControl(null, Validators.required),
      LastName: new FormControl(null, Validators.required),
    });
  }

  onSubmit() {
    const user = this.loginForm.value;
    this.AuthService.authLogin(user).subscribe((response: any) => {
      this.isLogin = true;
      localStorage.setItem('token', response);
      this.initTables(response);
    });
  }

  onModalSubmit() {
    if (this.isEdit) {
      console.log(this.UserForm.value);
      this.AuthService.updateUserData(
        this.userId,
        this.UserForm.value
      ).subscribe((res) => {
        console.log(res);
        this.onCloseHandled();
        this.rerender();
      });
    } else {
      this.AuthService.addUser(this.UserForm.value).subscribe((res) => {
        this.onCloseHandled();
        this.rerender();
      });
    }
  }

  initTables(token?) {
    const that = this;
    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 2,
      serverSide: true,
      processing: true,
      columnDefs: [{ width: '20%', targets: 3 }],
      ajax: (dataTablesParameters: any, callback) => {
        that.http
          .post<DataTablesResponse>(
            'http://localhost:51536/api/user/getuser',
            dataTablesParameters,
            {
              headers: {
                Authorization: 'Bearer ' + token,
              },
            }
          )
          .subscribe((resp: any) => {
            console.log(resp);
            that.persons = resp.data;

            callback({
              recordsTotal: resp.totalData,
              recordsFiltered: resp.totalData,
              data: [],
            });
          });
      },
      columns: [
        { data: 'id' },
        { data: 'FirstName' },
        { data: 'LastName' },
        { data: 'Actions' },
      ],
    };
  }

  rerender() {
    this.datatableElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
      this.onKeySearch();
    });
  }

  ngOnDestroy(): void {
    console.log('ngDestroy');
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  onDelete(person) {
    console.log(person);
    // this.http
    //   .delete('http://localhost:51536/api/user' + '/' + person.id)
    //   .subscribe((res) => {});
    this.rerender();
  }
}
