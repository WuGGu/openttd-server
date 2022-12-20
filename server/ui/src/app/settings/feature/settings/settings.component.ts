import {Component, OnInit} from '@angular/core';
import {FormBuilder, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {OpenttdServerResourceService} from '../../../api/services/openttd-server-resource.service';
import {ApplicationService} from '../../../shared/services/application.service';
import {HttpErrorResponse} from '@angular/common/http';
import {loadServerConfig, patchServerConfig} from '../../../shared/store/actions/app.actions';
import {Subscription} from 'rxjs';
import {selectConfig} from '../../../shared/store/selectors/app.selectors';
import {filter} from 'rxjs/operators';
import {clone} from '../../../shared/services/utils';
import {OpenttdServerConfigGet} from '../../../api/models/openttd-server-config-get';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {


  adminFormGroup;

  basicSettingsFormGroup;

  config: OpenttdServerConfigGet | undefined;

  private sub = new Subscription();

  constructor(private store: Store<{}>, private api: OpenttdServerResourceService, private fb: FormBuilder, private app: ApplicationService) {
    this.adminFormGroup = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      newPasswordRepeat: ['', [Validators.required]]
    }, {
      validators: this.passwordsEqualValidator
    });

    this.basicSettingsFormGroup = this.fb.group({
      autoSaveMinutes: [5, [Validators.required, Validators.min(-1)]],
      numberOfAutoSaveFilesToKeep: [1, [Validators.required, Validators.min(1)]],
      numberOfManuallySaveFilesToKeep: [1, [Validators.required, Validators.min(1)]],
    });

  }

  ngOnInit(): void {
    this.store.dispatch(loadServerConfig({src: SettingsComponent.name}));
    this.sub.add(this.store.select(selectConfig).pipe(filter(c => c != null)).subscribe(c => {
      this.config = clone(c);
      this.basicSettingsFormGroup.controls.autoSaveMinutes.patchValue(this.config?.autoSaveMinutes!);
      this.basicSettingsFormGroup.controls.numberOfAutoSaveFilesToKeep.patchValue(this.config?.numberOfAutoSaveFilesToKeep!);
      this.basicSettingsFormGroup.controls.numberOfManuallySaveFilesToKeep.patchValue(this.config?.numberOfManuallySaveFilesToKeep!);
    }))
  }

  updatePassword() {
    if (this.adminFormGroup.valid) {
      this.api.updateOpenttdServerConfig({body: {password: this.adminFormGroup.value.newPassword!, oldPassword: this.adminFormGroup.value.oldPassword!}}).subscribe(
        {
          next: (v) => {
            this.app.createInfoMessage("Password changed successfully!")
          },
          error: (e: HttpErrorResponse) => {
            this.app.handleError(e);
          }
        }
      );
    }
  }

  passwordsEqualValidator: ValidatorFn = (): ValidationErrors | null => {
    if (this.adminFormGroup && this.adminFormGroup.value.newPassword !== this.adminFormGroup.value.newPasswordRepeat) {
      return {'not-equal': true}
    }
    return null;
  };

  updateConfig() {
    if (this.basicSettingsFormGroup.valid) {
      this.store.dispatch(patchServerConfig({
        src: SettingsComponent.name,
        patch: {
          autoSaveMinutes: this.basicSettingsFormGroup.value.autoSaveMinutes!,
          numberOfAutoSaveFilesToKeep: this.basicSettingsFormGroup.value.numberOfAutoSaveFilesToKeep!,
          numberOfManuallySaveFilesToKeep: this.basicSettingsFormGroup.value.numberOfManuallySaveFilesToKeep!,
        }
      }))
    }

  }
}
