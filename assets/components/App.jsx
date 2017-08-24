import React from 'react';
import ReactDOM from 'react-dom';
var $ = require('jquery');

class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            url : '',
            error : '',
            errorStyle : { color: 'red' },
            title : '',
            data : [],
            urlInputGroupClass : 'form-group',
            processing : false
        };

        this.updateState = this.updateState.bind(this);
        this.submit = this.submit.bind(this);
        this.onGetHtmlDone = this.onGetHtmlDone.bind(this);
        this.removeProduct = this.removeProduct.bind(this);
        this.generateError = this.generateError.bind(this);
    }

    updateState(e) {
        let value = e.target.value;

        this.setState({
            url: value,
            error : this.generateError(value)
        });
    }

    submit(e) {
        e.preventDefault();

        if (this.state.error || !this.state.url) {
            return;
        }

        this.setState({ processing: true });

         $.ajax({ url: this.props.backendApiUrl + '/api/parse?url=' + this.state.url }).always(this.onGetHtmlDone);
    }

    onGetHtmlDone(data, textStatus, errorThrown) {
        if (textStatus != 'success') {
            this.setState({ error : 'Oops! An error occur. Please try again.' });
            return;
        }

        let html = $.parseHTML(data);
        let domHtml = $(html);
        let features = domHtml.find('#prod_content_wrapper > div.prod_l_content > div.prod_content > div > ul li');
        let featureArray = [];
        features.each(function (index) {
            featureArray.push($(this).find('span').text());
        });
        console.log('imageUrl', domHtml.find('#productImageBox > div.productImage.loaded').attr('data-big'));

        let item = {
            title : domHtml.find('#prod_title').text(),
            warrantyDuration : domHtml.find('#prod_content_wrapper .prod_l_content .prod_brief .prod-warranty .prod-warranty__term').text(),
            warrantyInfo : domHtml.find('#prod_content_wrapper .prod_l_content .prod_brief .prod-warranty .prod-warranty__type').text(),
            features : featureArray,
            price : domHtml.find('#special_price_box').text(),
            currency : domHtml.find('#special_currency_box').text(),
            soldBy : domHtml.find('#prod_content_wrapper > div.prod_r_content > div.seller-details > div.basic-info > div.basic-info__main > a').text(),
            imageUrl : domHtml.find('#productImageBox > div.productImage.loaded').attr('data-big')
        };
        this.state.data.push(item);

        this.setState({
            data : this.state.data,
            url : '',
            error : this.generateError(this.state.url),
            processing: false
        });
    }

    removeProduct(e) {
        let index = e.target.getAttribute('data-index');
        let data = this.state.data;
        data.splice(index, 1);
        this.setState({
            data : data,
            error : this.generateError(this.state.url)
        })
    }

    generateError(url) {
        if (url !== '' && !url.startsWith(this.props.allowedUrlPrefix)) {
            return this.props.invalidUrlMessage;
        }

        if (this.state.data.length >= this.props.maxNoOfProducts) {
            return this.props.exceedNoOfProductsMsg;
        }
    }

    render() {
        return (
            <div>
                <div className='container'>
                    <div className='row'>
                        <div className='col-md-12'>
                            <form onSubmit={ this.submit }>
                                <div className="input-group">
                                    <input
                                        value={ this.state.url }
                                        onChange={ this.updateState }
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Lazada SG Product URL here .e.g http://www.lazada.sg/htc-u11-41358191.html"
                                        disabled={ this.state.data.length == this.props.maxNoOfProducts }
                                        autoFocus />
                                    <span className="input-group-btn">
                                        <button type='submit' className="btn btn-primary" disabled={ this.state.data.length == this.props.maxNoOfProducts || this.state.processing }>Compare Now!</button>
                                    </span>
                                </div>
                                <div style={ this.state.errorStyle }>
                                    { this.state.error }
                                </div>
                            </form>
                        </div>
                    </div>

                    <br />

                    <div className='row'>
                        {
                            this.state.data.map(
                                (item, i) =>
                                    <div className='col-md-4'>
                                        <table key={ i } className='table-striped product-info' style={ this.props.productInfoTableStyle }>
                                            <tbody>

                                            <tr>
                                                <td colSpan='2' className='text-right'>
                                                    <button
                                                        className='btn btn-danger'
                                                        data-toggle="tooltip"
                                                        data-placement="right"
                                                        title="Remove this from compare result"
                                                        data-index={ i }
                                                        onClick={ this.removeProduct }>
                                                        <span aria-hidden="true">&times;</span>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan='2'><img src={ item.imageUrl } alt={ item.title } /></td>
                                            </tr>
                                            <tr>
                                                <td>Product Name</td>
                                                <td><strong>{ item.title }</strong></td>
                                            </tr>
                                            <tr>
                                                <td>Price</td>
                                                <td><strong>{ item.price }</strong> { item.currency }</td>
                                            </tr>
                                            <tr>
                                                <td>Warranty Info</td>
                                                <td><strong>{ item.warrantyDuration }</strong> { item.warrantyInfo }</td>
                                            </tr>
                                            <tr>
                                                <td>Sold By</td>
                                                <td>{ item.soldBy }</td>
                                            </tr>
                                            <tr>
                                                <td>Features</td>
                                                <td>
                                                    <ul>
                                                        {
                                                            item.features.map((feature, itemIndex) =>
                                                                <li>{ feature }</li>
                                                            )
                                                        }
                                                    </ul>
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                            )
                        }
                    </div>
                </div>

            </div>
        );
    }
}

App.defaultProps = {
    backendApiUrl : 'http://ec2-54-179-186-144.ap-southeast-1.compute.amazonaws.com',
    allowedUrlPrefix : 'http://www.lazada.sg/',
    productInfoTableStyle : {
        width: '100%'
    },
    maxNoOfProducts : 3,
    invalidUrlMessage : 'Invalid URL. Only URLs starting with http://www.lazada.sg/ is allowed.',
    exceedNoOfProductsMsg : 'You can only compared 3 products at a time. Please remove products to compare another one.',
}

export default App;